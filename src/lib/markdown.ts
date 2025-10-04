import matter from "gray-matter";

const GITHUB_OWNER = process.env.CONTENT_GITHUB_OWNER ?? "makoncline";
const GITHUB_REPO = process.env.CONTENT_GITHUB_REPO ?? "van";
const GITHUB_BRANCH = process.env.CONTENT_GITHUB_BRANCH ?? "main";
const GITHUB_CONTENT_DIR = process.env.CONTENT_GITHUB_DIR ?? "content";

const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
const GITHUB_CONTENTS_BASE = `${GITHUB_API_BASE}/contents/${GITHUB_CONTENT_DIR}`;
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${GITHUB_CONTENT_DIR}`;

interface GitHubContentItem {
  name: string;
  path: string;
  type: "file" | "dir";
}

function githubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };
  const token =
    process.env.CONTENT_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN ?? undefined;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export interface MarkdownFile {
  slug: string;
  content: string;
  frontMatter: Record<string, unknown>;
}

function extractTitleFromContent(fileContent: string): string | null {
  const { content } = matter(fileContent);
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : null;
}

async function fetchDirectoryItems(path = ""): Promise<GitHubContentItem[]> {
  const base = path ? `${GITHUB_CONTENTS_BASE}/${path}` : GITHUB_CONTENTS_BASE;
  const url = `${base}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  try {
    const response = await fetch(url, {
      headers: githubHeaders(),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("GitHub directory fetch failed", {
        status: response.status,
        statusText: response.statusText,
        url,
      });
      return [];
    }
    const data = (await response.json()) as GitHubContentItem[];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching GitHub directory:", { url, error });
    return [];
  }
}

async function fetchFileContent(filename: string): Promise<string | null> {
  const base = `${GITHUB_CONTENTS_BASE}/${encodeURIComponent(filename)}`;
  const url = `${base}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  try {
    const response = await fetch(url, {
      headers: {
        ...githubHeaders(),
        Accept: "application/vnd.github.v3.raw",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("GitHub file fetch failed", {
        status: response.status,
        statusText: response.statusText,
        url,
      });
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error("Error fetching GitHub file:", { url, error });
    return null;
  }
}

export async function getAllMarkdownFiles(): Promise<string[]> {
  const items = await fetchDirectoryItems();
  return items
    .filter((item) => item.type === "file" && item.name.endsWith(".md"))
    .map((item) => item.name);
}

async function buildSlugToFilenameMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const files = await getAllMarkdownFiles();
  for (const file of files) {
    const originalSlug = file.replace(".md", "");
    const urlSlug = slugify(originalSlug);
    map.set(urlSlug, file);
  }
  return map;
}

async function getSlugToFilenameMap(): Promise<Map<string, string>> {
  return buildSlugToFilenameMap();
}

export async function getMarkdownFile(
  slug: string
): Promise<MarkdownFile | null> {
  try {
    const slugToFilename = await getSlugToFilenameMap();
    const filename = slugToFilename.get(slug);
    if (!filename) {
      return null;
    }

    const fileContent = await fetchFileContent(filename);
    if (!fileContent) {
      return null;
    }
    const { data: frontMatter, content } = matter(fileContent);

    return {
      slug,
      content,
      frontMatter,
    };
  } catch (error) {
    console.error(`Error reading file ${slug}:`, error);
    return null;
  }
}

export function isPublished(
  frontMatter: Record<string, unknown> | undefined
): boolean {
  if (!frontMatter || typeof frontMatter !== "object") return true;
  // Treat missing as published; only explicit false hides the page
  return frontMatter.published !== false;
}

function normalizeAlias(value: string): string {
  return value.trim().toLowerCase();
}

function slugify(value: string): string {
  return normalizeAlias(value).replace(/\s+/g, "-");
}

async function buildAliasToSlugMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const files = await getAllMarkdownFiles();
  for (const file of files) {
    const originalSlug = file.replace(".md", "");
    const urlSlug = slugify(originalSlug); // URL-safe version

    // Primary aliases - map to URL-safe slug
    map.set(normalizeAlias(originalSlug), urlSlug);
    map.set(normalizeAlias(originalSlug.replace(/-/g, " ")), urlSlug);

    const fileContent = await fetchFileContent(file);
    if (fileContent) {
      const title = extractTitleFromContent(fileContent);
      if (title) {
        map.set(normalizeAlias(title), urlSlug);
        map.set(normalizeAlias(slugify(title)), urlSlug);
      }
    }
  }
  return map;
}

async function getAliasToSlugMap(): Promise<Map<string, string>> {
  return buildAliasToSlugMap();
}

async function getExistingSlugs(): Promise<Set<string>> {
  const slugToFilename = await getSlugToFilenameMap();
  return new Set(slugToFilename.keys());
}

export async function processWikiLinks(content: string): Promise<string> {
  // Convert [[target]] to [target](/resolved-slug) or [target](/missing?slug=...)
  // Convert [[target|display text]] to [display text](/resolved-slug) or [display text](/missing?slug=...)
  const aliasToSlug = await getAliasToSlugMap();
  const existingSlugs = await getExistingSlugs();

  return content.replace(
    /\[\[([^\]]+)\]\]/g,
    (match, linkContent, offset: number, full: string) => {
      // If this match is part of an image embed ![[...]], skip here
      if (offset > 0 && full[offset - 1] === "!") {
        return match;
      }

      const [rawTarget, rawDisplay] = linkContent.split("|");
      const target = rawTarget.trim();
      const displayText = rawDisplay ? rawDisplay.trim() : target;

      // If target points to an image or file with extension, route to attachments
      const ext = getFileExtension(target);
      const isImage = [
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".svg",
      ].includes(ext);
      if (isImage) {
        const base = getBasename(target);
        const encoded = encodeURIComponent(base);
        const url = `${getAttachmentsBaseUrl()}/${encoded}`;
        // If user provided display text, use it as alt text
        return `![${displayText}](${url})`;
      }

      const candidates = [
        normalizeAlias(target),
        normalizeAlias(target.replace(/-/g, " ")),
        normalizeAlias(slugify(target)),
      ];

      let resolvedSlug: string | undefined;
      for (const key of candidates) {
        const found = aliasToSlug.get(key);
        if (found) {
          resolvedSlug = found;
          break;
        }
      }

      const slug = resolvedSlug ?? slugify(target);

      // Check if the page actually exists
      if (existingSlugs.has(slug)) {
        return `[${displayText}](/${slug})`;
      } else {
        // Don't create a link for missing pages - just show plain text
        return displayText;
      }
    }
  );
}

function getAttachmentsBaseUrl(): string {
  return `${GITHUB_RAW_BASE}/attachments`;
}

function getFileExtension(value: string): string {
  const idx = value.lastIndexOf(".");
  if (idx === -1) return "";
  return value.slice(idx).toLowerCase();
}

function getBasename(value: string): string {
  const segments = value.split(/[\\/]/);
  return segments[segments.length - 1] ?? value;
}

export function processObsidianEmbeds(content: string): string {
  // Convert ![[filename]] or ![[filename|alt]] to standard markdown image
  // Assets are served directly from the repository via raw.githubusercontent.com
  return content.replace(/!\s*\[\[([^\]]+)\]\]/g, (match, embedContent) => {
    const [rawTarget, rawAlt] = embedContent.split("|");
    const target = rawTarget.trim();
    const altText = rawAlt ? rawAlt.trim() : target;
    // Keep just the base filename and URL-encode it for safe paths
    const base = getBasename(target);
    const encoded = encodeURIComponent(base);
    const url = `${getAttachmentsBaseUrl()}/${encoded}`;

    const ext = getFileExtension(base);
    const isImage = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"].includes(
      ext
    );
    if (isImage) {
      return `![${altText}](${url})`;
    }
    // Non-image embeds become regular links to the attachment
    return `[${altText}](${url})`;
  });
}

export async function processContent(content: string): Promise<string> {
  const withEmbeds = processObsidianEmbeds(content);
  return processWikiLinks(withEmbeds);
}

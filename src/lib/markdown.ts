import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDirectory = path.join(process.cwd(), "content");

export interface MarkdownFile {
  slug: string;
  content: string;
  frontMatter: Record<string, unknown>;
}

export function getAllMarkdownFiles(): string[] {
  try {
    const files = fs.readdirSync(contentDirectory);
    return files.filter((file) => file.endsWith(".md"));
  } catch (error) {
    console.error("Error reading content directory:", error);
    return [];
  }
}

let cachedSlugToFilename: Map<string, string> | null = null;

function buildSlugToFilenameMap(): Map<string, string> {
  const map = new Map<string, string>();
  const files = getAllMarkdownFiles();
  for (const file of files) {
    const originalSlug = file.replace(".md", "");
    const urlSlug = slugify(originalSlug);
    map.set(urlSlug, file);
  }
  return map;
}

function getSlugToFilenameMap(): Map<string, string> {
  if (!cachedSlugToFilename) {
    cachedSlugToFilename = buildSlugToFilenameMap();
  }
  return cachedSlugToFilename;
}

export function getMarkdownFile(slug: string): MarkdownFile | null {
  try {
    // First try direct filename match (for backward compatibility)
    let filePath = path.join(contentDirectory, `${slug}.md`);
    if (!fs.existsSync(filePath)) {
      // Try URL slug to filename mapping
      const slugToFilename = getSlugToFilenameMap();
      const filename = slugToFilename.get(slug);
      if (filename) {
        filePath = path.join(contentDirectory, filename);
      }
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
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

export function getAllMarkdownDocuments(): MarkdownFile[] {
  const files = getAllMarkdownFiles();
  const documents: MarkdownFile[] = [];
  for (const file of files) {
    const originalSlug = file.replace(".md", "");
    const urlSlug = slugify(originalSlug);
    try {
      const filePath = path.join(contentDirectory, file);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const { data: frontMatter, content } = matter(fileContent);
      documents.push({ slug: urlSlug, content, frontMatter });
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }
  return documents;
}

export function isPublished(
  frontMatter: Record<string, unknown> | undefined
): boolean {
  if (!frontMatter || typeof frontMatter !== "object") return true;
  // Treat missing as published; only explicit false hides the page
  return frontMatter.published !== false;
}

function extractTitleFromContent(fileContent: string): string | null {
  const { content } = matter(fileContent);
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : null;
}

function normalizeAlias(value: string): string {
  return value.trim().toLowerCase();
}

function slugify(value: string): string {
  return normalizeAlias(value).replace(/\s+/g, "-");
}

let cachedAliasToSlug: Map<string, string> | null = null;

function buildAliasToSlugMap(): Map<string, string> {
  const map = new Map<string, string>();
  const files = getAllMarkdownFiles();
  for (const file of files) {
    const originalSlug = file.replace(".md", "");
    const urlSlug = slugify(originalSlug); // URL-safe version
    const filePath = path.join(contentDirectory, file);
    let fileContent = "";
    try {
      fileContent = fs.readFileSync(filePath, "utf8");
    } catch {
      // ignore read errors for alias map
    }
    const title = fileContent ? extractTitleFromContent(fileContent) : null;

    // Primary aliases - map to URL-safe slug
    map.set(normalizeAlias(originalSlug), urlSlug);
    map.set(normalizeAlias(originalSlug.replace(/-/g, " ")), urlSlug);

    if (title) {
      map.set(normalizeAlias(title), urlSlug);
      map.set(normalizeAlias(slugify(title)), urlSlug);
    }
  }
  return map;
}

function getAliasToSlugMap(): Map<string, string> {
  if (!cachedAliasToSlug) {
    cachedAliasToSlug = buildAliasToSlugMap();
  }
  return cachedAliasToSlug;
}

export function processWikiLinks(content: string): string {
  // Convert [[target]] to [target](/resolved-slug) or [target](/missing?slug=...)
  // Convert [[target|display text]] to [display text](/resolved-slug) or [display text](/missing?slug=...)
  const aliasToSlug = getAliasToSlugMap();
  const existingSlugs = new Set(
    getAllMarkdownDocuments().map((doc) => doc.slug)
  );

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
      const ext = path.extname(target).toLowerCase();
      const isImage = [
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".svg",
      ].includes(ext);
      if (isImage) {
        const base = path.basename(target);
        const encoded = encodeURIComponent(base);
        const url = `/attachments/${encoded}`;
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

export function processObsidianEmbeds(content: string): string {
  // Convert ![[filename]] or ![[filename|alt]] to standard markdown image
  // We assume images are placed in public/attachments and served from /attachments
  return content.replace(/!\s*\[\[([^\]]+)\]\]/g, (match, embedContent) => {
    const [rawTarget, rawAlt] = embedContent.split("|");
    const target = rawTarget.trim();
    const altText = rawAlt ? rawAlt.trim() : target;
    // Keep just the base filename and URL-encode it for safe paths
    const base = path.basename(target);
    const encoded = encodeURIComponent(base);
    const url = `/attachments/${encoded}`;

    const ext = path.extname(base).toLowerCase();
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

export function processContent(content: string): string {
  return processWikiLinks(processObsidianEmbeds(content));
}

const contentAttachmentsDir = path.join(contentDirectory, "attachments");
const publicDirectory = path.join(process.cwd(), "public");
const publicAttachmentsDir = path.join(publicDirectory, "attachments");

function ensureDirExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFileIfNewer(srcFile: string, destFile: string) {
  try {
    const srcStat = fs.statSync(srcFile);
    let shouldCopy = true;
    if (fs.existsSync(destFile)) {
      const destStat = fs.statSync(destFile);
      shouldCopy = srcStat.mtimeMs > destStat.mtimeMs;
    }
    if (shouldCopy) {
      fs.copyFileSync(srcFile, destFile);
    }
  } catch (err) {
    console.error("Error copying file", { srcFile, destFile, err });
  }
}

function copyDirRecursive(srcDir: string, destDir: string) {
  ensureDirExists(destDir);
  const entries = fs.existsSync(srcDir)
    ? fs.readdirSync(srcDir, { withFileTypes: true })
    : [];
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      copyFileIfNewer(srcPath, destPath);
    }
  }
}

export function syncAttachments(): void {
  // Mirror any files in content/attachments to public/attachments at build-time
  ensureDirExists(publicAttachmentsDir);
  if (fs.existsSync(contentAttachmentsDir)) {
    copyDirRecursive(contentAttachmentsDir, publicAttachmentsDir);
  }
}

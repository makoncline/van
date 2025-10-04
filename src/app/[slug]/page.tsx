import { MarkdownArticle } from "@/app/components/markdown-article";
import { getMarkdownFile } from "@/lib/markdown";

interface RouteParams {
  slug: string;
}

interface PageProps {
  params: Promise<RouteParams>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default async function MarkdownPage({ params }: PageProps) {
  const { slug } = await params;
  return <MarkdownArticle slug={slug} />;
}

export async function generateMetadata({
  params,
}: PageProps) {
  const { slug } = await params;
  const markdownFile = await getMarkdownFile(slug);

  if (!markdownFile) {
    return {
      title: "Page Not Found",
    };
  }

  // Extract title from content (first heading)
  const fmTitle = markdownFile.frontMatter?.title as string | undefined;
  const titleMatch = markdownFile.content.match(/^#\s+(.+)$/m);
  const title = fmTitle || (titleMatch ? titleMatch[1] : slug);
  const description =
    (markdownFile.frontMatter?.description as string | undefined) ||
    `A page from my digital garden: ${title}`;

  return {
    title: `${title} - Van`,
    description,
  };
}

import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import {
  getMarkdownFile,
  getAllMarkdownDocuments,
  isPublished,
  processContent,
  syncAttachments,
} from "@/lib/markdown";
import {
  H1,
  H2,
  H3,
  H4,
  P,
  InlineCode,
  MultilineCode,
  List,
  Quote,
} from "@/app/components/ui/typography";

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const docs = getAllMarkdownDocuments().filter((doc) =>
    isPublished(doc.frontMatter)
  );
  return docs.map((doc) => ({ slug: doc.slug }));
}

export default async function MarkdownPage({ params }: PageProps) {
  // Ensure attachments are available in public on build/export
  syncAttachments();
  const markdownFile = getMarkdownFile(params.slug);

  if (!markdownFile) {
    notFound();
  }

  if (!isPublished(markdownFile.frontMatter)) {
    notFound();
  }

  // Process embeds and wiki links
  const processedContent = processContent(markdownFile.content);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <article className="prose prose-lg max-w-none">
        <MDXRemote
          source={processedContent}
          components={{
            h1: H1,
            h2: H2,
            h3: H3,
            h4: H4,
            p: P,
            ul: List,
            blockquote: Quote,
            code: InlineCode,
            pre: MultilineCode,
            a: (
              props: AnchorHTMLAttributes<HTMLAnchorElement> & {
                children?: ReactNode;
              }
            ) => {
              const href =
                typeof props.href === "string" ? props.href : undefined;
              const isInternalLink =
                href?.startsWith("/") || href?.startsWith("#");
              if (href && isInternalLink) {
                return <Link href={href}>{props.children}</Link>;
              }
              // External link fallback
              return <a {...props} />;
            },
          }}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeHighlight],
            },
          }}
        />
      </article>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageProps["params"]>;
}) {
  const { slug } = await params;
  const markdownFile = getMarkdownFile(slug);

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

import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import {
  getMarkdownFile,
  isPublished,
  processContent,
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

interface MarkdownArticleProps {
  slug: string;
}

const mdxComponents = {
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
    const href = typeof props.href === "string" ? props.href : undefined;
    const isInternalLink = href?.startsWith("/") || href?.startsWith("#");
    if (href && isInternalLink) {
      return <Link href={href}>{props.children}</Link>;
    }
    return <a {...props} />;
  },
};

export async function MarkdownArticle({ slug }: MarkdownArticleProps) {
  const markdownFile = await getMarkdownFile(slug);

  if (!markdownFile || !isPublished(markdownFile.frontMatter)) {
    notFound();
  }

  const processedContent = await processContent(markdownFile.content);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <article className="prose prose-lg max-w-none">
        <MDXRemote
          source={processedContent}
          components={mdxComponents}
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

import type { MDXRemoteProps } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

export const markdownOptions = {
  blockJS: true,
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight],
  },
} satisfies NonNullable<MDXRemoteProps["options"]>;

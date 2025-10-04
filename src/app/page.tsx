import { MarkdownArticle } from "@/app/components/markdown-article";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default function Home() {
  return <MarkdownArticle slug="home" />;
}

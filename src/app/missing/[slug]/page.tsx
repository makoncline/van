import Link from "next/link";
import { H1, P, InlineCode } from "@/app/components/ui/typography";

export const dynamic = "force-dynamic";

interface MissingPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function MissingPage({ params }: MissingPageProps) {
  const { slug } = await params;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <article className="prose prose-lg max-w-none">
        <H1>Page Not Found</H1>
        <P>
          The page <InlineCode>{slug}</InlineCode> doesn&apos;t exist yet.
        </P>
        <P>
          This might be a wiki link that references a page you haven&apos;t
          created yet. You can create a new markdown file in the{" "}
          <InlineCode>content/</InlineCode> directory to add this page to your
          digital garden.
        </P>
        <P>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Home
          </Link>
        </P>
      </article>
    </div>
  );
}

export async function generateMetadata({ params }: MissingPageProps) {
  const { slug } = await params;
  return {
    title: `Missing: ${slug} - Van`,
    description: `The page ${slug} doesn't exist in the digital garden.`,
  };
}

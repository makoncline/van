import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import matter from "gray-matter";
import { renderToStaticMarkup } from "react-dom/server";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

test("remote Markdown keeps formatting and does not run JavaScript", async () => {
  const render = async (source) => {
    const { content } = await compileMDX({
      source,
      options: {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeHighlight],
        },
      },
    });
    return renderToStaticMarkup(content);
  };

  try {
    for (const source of [
      'Before {(globalThis.__vanMdxMarker = "executed")} after',
      '<span {...(globalThis.__vanMdxMarker = "executed", {})}>after</span>',
    ]) {
      delete globalThis.__vanMdxMarker;
      const html = await render(source);
      assert.equal(globalThis.__vanMdxMarker, undefined);
      assert.match(html, /after/);
      assert.doesNotMatch(html, /executed/);
    }
  } finally {
    delete globalThis.__vanMdxMarker;
  }

  const power = matter(
    await readFile(new URL("../content/power.md", import.meta.url), "utf8"),
  );
  assert.match(await render(power.content), /<table>/);
  assert.match(await render("- [x] complete"), /type="checkbox"/);
  assert.match(await render("[Heater](/heater)"), /href="\/heater"/);
  assert.match(await render("![image](https://example.test/image.png)"), /<img/);
  assert.match(await render("```js\nconst value = 1;\n```"), /hljs-keyword/);
});

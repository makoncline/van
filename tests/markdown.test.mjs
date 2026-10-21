import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { compileMDX } from "next-mdx-remote/rsc";
import { markdownOptions } from "../src/lib/mdx-options.ts";
import { getMarkdownFile, processContent } from "../src/lib/markdown.ts";

const render = async (source) => {
  const { content } = await compileMDX({ source, options: markdownOptions });
  return renderToStaticMarkup(content);
};

test("Markdown expressions cannot execute server JavaScript", async () => {
  const cases = [
    'Before {(globalThis.__vanMdxMarker = "executed")} after',
    '{(globalThis.__vanMdxMarker = "executed")}\n\nAfter',
    '<span title={(globalThis.__vanMdxMarker = "executed")}>After</span>',
    '<span {...(globalThis.__vanMdxMarker = "executed", {})}>After</span>',
  ];
  try {
    for (const source of cases) {
      delete globalThis.__vanMdxMarker;
      const html = await render(source);
      assert.equal(globalThis.__vanMdxMarker, undefined, source);
      assert.match(html, /[Aa]fter/);
      assert.doesNotMatch(html, /executed/);
    }
  } finally {
    delete globalThis.__vanMdxMarker;
  }
});

test("repository Markdown retains links, images, task lists, tables and code", async (t) => {
  const names = (await readdir(new URL("../content/", import.meta.url)))
    .filter((name) => name.endsWith(".md"));
  const files = new Map(await Promise.all(names.map(async (name) => [
    name, await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"),
  ])));
  t.mock.method(globalThis, "fetch", async (input) => {
    const url = new URL(String(input));
    assert.equal(url.origin, "https://api.github.com");
    const match = url.pathname.match(/\/contents\/content(?:\/(.+))?$/);
    assert.ok(match, `Unexpected fetch: ${url.pathname}`);
    if (!match[1]) {
      return Response.json(names.map((name) => ({ name, type: "file" })));
    }
    const body = files.get(decodeURIComponent(match[1]));
    return new Response(body ?? "Not found", { status: body ? 200 : 404 });
  });
  const rendered = new Map();
  for (const name of names) {
    const slug = name.slice(0, -3).toLowerCase().replace(/\s+/g, "-");
    const file = await getMarkdownFile(slug);
    assert.ok(file, name);
    const html = await render(await processContent(file.content));
    assert.match(html, /<h1[ >]/, name);
    rendered.set(slug, html);
  }
  assert.match(rendered.get("home"), /href="\/heater"/);
  assert.match(rendered.get("home"), /IMG_5733%202\.png/);
  assert.match(rendered.get("fan"), /type="checkbox"/);
  assert.match(rendered.get("power"), /<table>/);
  assert.equal(await getMarkdownFile("missing-page"), null);
  const code = await render("```js\nconst value = 1;\n```");
  assert.match(code, /hljs-keyword/);
});

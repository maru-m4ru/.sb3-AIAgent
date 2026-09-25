import fs from "node:fs/promises";

const INPUT =
  "knowledge/pages.json";

const OUTPUT =
  "knowledge/index.json";

const source =
  JSON.parse(
    await fs.readFile(
      INPUT,
      "utf8"
    )
  );

const entries =
  source.pages.map((page) => {
    const terms = Object.create(null);

    const text = [
      page.title,
      ...(page.headings ?? []),
      ...(page.categories ?? []),
      page.text
    ].join(" ");

    for (const token of tokenize(text)) {
      terms[token] =
        (terms[token] ?? 0) + 1;
    }

    return {
      pageId: page.pageId,
      title: page.title,
      url: page.url,
      terms,
      headings: page.headings ?? [],
      categories: page.categories ?? []
    };
  });

await fs.writeFile(
  OUTPUT,
  JSON.stringify(
    {
      generatedAt:
        new Date().toISOString(),
      sourcePageCount:
        source.pages.length,
      entries
    },
    null,
    2
  ),
  "utf8"
);

console.log(
  `Wrote ${entries.length} index entries to ${OUTPUT}`
);

function tokenize(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_:-]+/g, " ")
    .split(/\\s+/)
    .filter(Boolean);
}

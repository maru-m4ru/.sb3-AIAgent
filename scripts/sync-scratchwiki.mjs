import fs from "node:fs/promises";
import path from "node:path";

const API =
  "https://en.scratch-wiki.info/w/api.php";

const OUTPUT =
  path.resolve("knowledge/pages.json");

const REQUEST_DELAY_MS = 150;

async function api(params) {
  const url = new URL(API);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(
      key,
      String(value)
    );
  }

  const response = await fetch(url, {
    headers: {
      "user-agent":
        "sb3-AIAgent/0.1 Scratch-Wiki-Knowledge-Sync"
    }
  });

  if (!response.ok) {
    throw new Error(
      `Scratch Wiki API failed: ${response.status}`
    );
  }

  return response.json();
}

async function sleep(ms) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getLicenseInfo() {
  const result = await api({
    action: "query",
    meta: "siteinfo",
    siprop: "general",
    format: "json",
    formatversion: "2"
  });

  return {
    rights: result?.query?.general?.rights ?? undefined,
    rightsUrl:
      result?.query?.general?.rightsurl ??
      undefined,
    sitename:
      result?.query?.general?.sitename ??
      "Scratch Wiki"
  };
}

async function getAllPages() {
  const titles = [];
  let continuation;

  do {
    const result = await api({
      action: "query",
      list: "allpages",
      apnamespace: "0",
      aplimit: "max",
      ...(continuation ?? {}),
      format: "json",
      formatversion: "2"
    });

    for (const page of result?.query?.allpages ?? []) {
      titles.push({
        pageid: page.pageid,
        title: page.title
      });
    }

    continuation = result?.continue
      ? {
          apcontinue: result.continue.apcontinue,
          continue: result.continue.continue
        }
      : undefined;

    await sleep(REQUEST_DELAY_MS);
  } while (continuation);

  return titles;
}

async function getPage(title) {
  const result = await api({
    action: "query",
    prop: "revisions|categories",
    titles: title,
    rvprop: "ids|timestamp|content",
    rvslots: "main",
    cllimit: "max",
    format: "json",
    formatversion: "2"
  });

  const page = result?.query?.pages?.[0];

  if (!page || page.missing) {
    return null;
  }

  const revision = page.revisions?.[0];
  const text =
    revision?.slots?.main?.content ?? "";

  const categories =
    (page.categories ?? [])
      .map((category) => category.title)
      .filter(Boolean);

  const headings = [];
  const headingPattern =
    /^={1,6}\\s*(.*?)\\s*={1,6}$/gm;

  for (const match of text.matchAll(headingPattern)) {
    if (match[1]) {
      headings.push(match[1].trim());
    }
  }

  return {
    pageId: page.pageid,
    title: page.title,
    url:
      "https://en.scratch-wiki.info/wiki/" +
      encodeURIComponent(
        page.title.replaceAll(" ", "_")
      ),
    revisionId:
      typeof revision?.revid === "number"
        ? revision.revid
        : undefined,
    fetchedAt: new Date().toISOString(),
    categories,
    headings,
    text,
    source: "scratch-wiki"
  };
}

const license = await getLicenseInfo();
const pageList = await getAllPages();

console.log(
  `Found ${pageList.length} main-namespace pages.`
);

const pages = [];
let processed = 0;

for (const entry of pageList) {
  const page = await getPage(entry.title);

  if (page) {
    pages.push({
      ...page,
      license: license.rights
    });
  }

  processed += 1;

  if (
    processed % 25 === 0 ||
    processed === pageList.length
  ) {
    console.log(
      `Fetched ${processed}/${pageList.length}`
    );
  }

  await sleep(REQUEST_DELAY_MS);
}

await fs.mkdir(
  path.dirname(OUTPUT),
  { recursive: true }
);

await fs.writeFile(
  OUTPUT,
  JSON.stringify(
    {
      source: "Scratch Wiki",
      sourceUrl:
        "https://en.scratch-wiki.info/",
      fetchedAt: new Date().toISOString(),
      license,
      pageCount: pages.length,
      pages
    },
    null,
    2
  ),
  "utf8"
);

console.log(
  `Wrote ${pages.length} pages to ${OUTPUT}`
);

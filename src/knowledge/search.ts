import type {
  KnowledgeIndexEntry,
  KnowledgePage,
  KnowledgeSearchResult
} from "./types";

export function searchKnowledge(
  pages: KnowledgePage[],
  query: string,
  limit = 8
): KnowledgeSearchResult[] {
  const queryTerms = tokenize(query);

  if (queryTerms.length === 0) {
    return [];
  }

  return pages
    .map((page) => scorePage(page, queryTerms))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function searchKnowledgeIndex(
  pages: KnowledgePage[],
  index: KnowledgeIndexEntry[],
  query: string,
  limit = 8
): KnowledgeSearchResult[] {
  const queryTerms = tokenize(query);
  const byId = new Map(
    pages.map((page) => [page.pageId, page])
  );

  return index
    .map((entry) => {
      let score = 0;

      for (const term of queryTerms) {
        score += entry.terms[term] ?? 0;
      }

      const titleText = tokenize(entry.title);
      for (const term of queryTerms) {
        if (titleText.includes(term)) {
          score += 8;
        }
      }

      const page = byId.get(entry.pageId);

      return {
        page,
        entry,
        score
      };
    })
    .filter((result) => result.page && result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((result) => ({
      pageId: result.entry.pageId,
      title: result.entry.title,
      url: result.entry.url,
      score: result.score,
      excerpt: makeExcerpt(
        result.page!.text,
        queryTerms
      )
    }));
}

function scorePage(
  page: KnowledgePage,
  queryTerms: string[]
): KnowledgeSearchResult {
  const titleTerms = tokenize(page.title);
  const textTerms = tokenize(page.text);
  const headingTerms = tokenize(
    page.headings.join(" ")
  );
  const categoryTerms = tokenize(
    page.categories.join(" ")
  );

  let score = 0;

  for (const term of queryTerms) {
    if (titleTerms.includes(term)) {
      score += 12;
    }

    if (headingTerms.includes(term)) {
      score += 6;
    }

    if (categoryTerms.includes(term)) {
      score += 4;
    }

    score += count(
      textTerms,
      term
    );
  }

  return {
    pageId: page.pageId,
    title: page.title,
    url: page.url,
    score,
    excerpt: makeExcerpt(
      page.text,
      queryTerms
    )
  };
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_:-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function count(
  values: string[],
  target: string
): number {
  let total = 0;

  for (const value of values) {
    if (value === target) {
      total += 1;
    }
  }

  return total;
}

function makeExcerpt(
  text: string,
  terms: string[]
): string {
  const normalized = text.replace(/\s+/g, " ");
  const lower = normalized.toLowerCase();

  let position = 0;

  for (const term of terms) {
    const found = lower.indexOf(term);

    if (found >= 0) {
      position = found;
      break;
    }
  }

  const start = Math.max(0, position - 180);
  const end = Math.min(
    normalized.length,
    position + 420
  );

  return normalized.slice(
    start,
    end
  );
}

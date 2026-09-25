export interface KnowledgePage {
  pageId: number;
  title: string;
  url: string;
  revisionId?: number;
  fetchedAt: string;
  categories: string[];
  headings: string[];
  text: string;
  source: "scratch-wiki";
  license?: string;
}

export interface KnowledgeIndexEntry {
  pageId: number;
  title: string;
  url: string;
  terms: Record<string, number>;
  headings: string[];
  categories: string[];
}

export interface KnowledgeSearchResult {
  pageId: number;
  title: string;
  url: string;
  score: number;
  excerpt: string;
}

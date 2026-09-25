export type ScratchProjectId = string;

export interface ScratchProjectMetadata {
  id: number;
  title?: string;
  author?: string;
  authorId?: number;
  projectToken?: string;
  [key: string]: unknown;
}

export interface ScratchAsset {
  md5ext: string;
  bytes: Uint8Array;
}

export interface ScratchBlock {
  opcode?: string;
  next?: string | null;
  parent?: string | null;
  inputs?: Record<string, unknown>;
  fields?: Record<string, unknown>;
  shadow?: boolean;
  topLevel?: boolean;
  x?: number;
  y?: number;
  [key: string]: unknown;
}

export interface ScratchTarget {
  name: string;
  isStage: boolean;
  blocks: Record<string, ScratchBlock>;
  variables?: Record<string, [string, string | number]>;
  lists?: Record<string, [string, unknown[]]>;
  broadcasts?: Record<string, string>;
  costumes?: Array<Record<string, unknown>>;
  sounds?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface ScratchProjectJson {
  targets: ScratchTarget[];
  monitors?: unknown[];
  extensions?: string[];
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface LoadedScratchProject {
  id: ScratchProjectId;
  metadata: ScratchProjectMetadata;
  project: ScratchProjectJson;
  assets: ScratchAsset[];
}

export type AgentVerdict =
  | "ALLOW"
  | "OPPOSE"
  | "UNCERTAIN";

export interface FeasibilityResult {
  verdict: AgentVerdict;
  reason: string;
  evidence?: string[];
}

export interface CodeArtifact {
  language: "sb3" | "html" | "css" | "python";
  files: Record<string, string | Uint8Array>;
}

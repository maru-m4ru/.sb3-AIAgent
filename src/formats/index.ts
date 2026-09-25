export interface LanguageAdapter {
  readonly language: "html" | "css" | "python";
  generate(input: string): Promise<string>;
}

export interface Sb3Adapter {
  generate(input: string): Promise<Uint8Array>;
}

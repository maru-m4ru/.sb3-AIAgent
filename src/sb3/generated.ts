import type {
  LoadedScratchProject,
  ScratchProjectJson,
  ScratchAsset
} from "../core/types";
import { buildSb3 } from "./builder";

export interface GeneratedScratchProject {
  project: ScratchProjectJson;
  assets: ScratchAsset[];
}

export async function buildGeneratedSb3(
  generated: GeneratedScratchProject
): Promise<Blob> {
  const project: LoadedScratchProject = {
    id: "generated",
    metadata: {
      id: 0,
      title: "Generated Scratch Project"
    },
    project: generated.project,
    assets: generated.assets
  };

  return buildSb3(project);
}

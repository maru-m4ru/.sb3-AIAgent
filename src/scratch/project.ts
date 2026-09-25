import type {
  LoadedScratchProject,
  ScratchAsset,
  ScratchProjectId,
  ScratchProjectJson,
  ScratchProjectMetadata
} from "../core/types";

const METADATA_URL = "https://api.scratch.mit.edu/projects";
const PROJECT_URL = "https://projects.scratch.mit.edu";

export function normalizeProjectId(value: string): ScratchProjectId {
  const match = value.trim().match(/^\d+$/);

  if (!match) {
    throw new Error("Scratch Project ID must contain only digits.");
  }

  return match[0];
}

export async function fetchScratchProject(
  inputId: string
): Promise<LoadedScratchProject> {
  const id = normalizeProjectId(inputId);

  const metadataResponse = await fetch(`${METADATA_URL}/${id}`);

  if (!metadataResponse.ok) {
    throw new Error(
      `Scratch metadata request failed: ${metadataResponse.status}`
    );
  }

  const metadata = await metadataResponse.json() as Record<string, unknown>;
  const token =
    typeof metadata.project_token === "string"
      ? metadata.project_token
      : undefined;

  const projectUrl = token
    ? `${PROJECT_URL}/${id}?token=${encodeURIComponent(token)}`
    : `${PROJECT_URL}/${id}`;

  const projectResponse = await fetch(projectUrl);

  if (!projectResponse.ok) {
    throw new Error(
      `Scratch project request failed: ${projectResponse.status}`
    );
  }

  const project = await projectResponse.json() as ScratchProjectJson;

  if (!Array.isArray(project.targets)) {
    throw new Error("The downloaded data is not a Scratch 3 project.");
  }

  const assets = await fetchProjectAssets(project);

  const normalizedMetadata: ScratchProjectMetadata = {
    id: Number(id),
    ...metadata,
    projectToken: token
  };

  return {
    id,
    metadata: normalizedMetadata,
    project,
    assets
  };
}

export async function fetchProjectAssets(
  project: ScratchProjectJson
): Promise<ScratchAsset[]> {
  const md5extValues = new Set<string>();

  for (const target of project.targets) {
    for (const costume of target.costumes ?? []) {
      if (typeof costume.md5ext === "string") {
        md5extValues.add(costume.md5ext);
      }
    }

    for (const sound of target.sounds ?? []) {
      if (typeof sound.md5ext === "string") {
        md5extValues.add(sound.md5ext);
      }
    }
  }

  const assets: ScratchAsset[] = [];

  for (const md5ext of md5extValues) {
    const response = await fetch(
      `https://assets.scratch.mit.edu/internalapi/asset/${encodeURIComponent(md5ext)}/get/`
    );

    if (!response.ok) {
      throw new Error(
        `Asset request failed for ${md5ext}: ${response.status}`
      );
    }

    assets.push({
      md5ext,
      bytes: new Uint8Array(await response.arrayBuffer())
    });
  }

  return assets;
}

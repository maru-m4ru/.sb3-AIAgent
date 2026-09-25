
import JSZip from "jszip";
import type {
  LoadedScratchProject,
  ScratchAsset,
  ScratchProjectJson
} from "../core/types";

export async function loadScratchProjectFile(
  file: File
): Promise<LoadedScratchProject> {
  if (!file.name.toLowerCase().endsWith(".sb3")) {
    throw new Error(
      "Scratch project files must use the .sb3 extension."
    );
  }

  const zip = await JSZip.loadAsync(file);
  const projectEntry = zip.file("project.json");

  if (!projectEntry) {
    throw new Error(
      "The .sb3 file does not contain project.json."
    );
  }

  const projectText =
    await projectEntry.async("string");

  let project: ScratchProjectJson;

  try {
    project =
      JSON.parse(projectText) as ScratchProjectJson;
  } catch {
    throw new Error(
      "project.json is not valid JSON."
    );
  }

  if (!Array.isArray(project.targets)) {
    throw new Error(
      "The selected file is not a valid Scratch 3 project."
    );
  }

  const assets =
    await extractProjectAssets(
      zip,
      project
    );

  return {
    id:
      file.name.replace(/\.sb3$/i, "") ||
      "local",
    metadata: {
      id: 0,
      title: file.name
    },
    project,
    assets
  };
}

async function extractProjectAssets(
  zip: JSZip,
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
    const entry = zip.file(md5ext);

    if (!entry) {
      throw new Error(
        "The .sb3 file is missing asset: " + md5ext
      );
    }

    assets.push({
      md5ext,
      bytes: new Uint8Array(
        await entry.async("arraybuffer")
      )
    });
  }

  return assets;
}

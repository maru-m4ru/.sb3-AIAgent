import JSZip from "jszip";
import type { LoadedScratchProject } from "../core/types";

export async function buildSb3(
  project: LoadedScratchProject
): Promise<Blob> {
  const zip = new JSZip();

  zip.file(
    "project.json",
    JSON.stringify(project.project)
  );

  for (const asset of project.assets) {
    zip.file(asset.md5ext, asset.bytes);
  }

  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE"
  });
}

export function downloadBlob(
  blob: Blob,
  filename: string
): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

import JSZip from "jszip";
import type { LoadedScratchProject } from "../core/types";
import { validateScratchProject } from "../scratch/validator";

export async function buildSb3(
  project: LoadedScratchProject
): Promise<Blob> {
  const validation =
    validateScratchProject(
      project.project
    );

  const errors =
    validation.issues.filter(
      (issue) => issue.level === "error"
    );

  if (errors.length > 0) {
    throw new Error(
      [
        "Scratch project validation failed:",
        ...errors.map(
          (issue) => issue.message
        )
      ].join("\n")
    );
  }

  const zip = new JSZip();

  zip.file(
    "project.json",
    JSON.stringify(project.project)
  );

  for (const asset of project.assets) {
    zip.file(
      asset.md5ext,
      asset.bytes
    );
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

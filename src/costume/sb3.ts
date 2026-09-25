import SparkMD5 from "spark-md5";
import type {
  ScratchAsset,
  ScratchTarget
} from "../core/types";
import type {
  CostumeDrawing
} from "./drawing";

export interface GeneratedCostume {
  costume: Record<string, unknown>;
  asset: ScratchAsset;
}

export function buildSvgCostume(
  drawing: CostumeDrawing
): GeneratedCostume {
  const bytes =
    new TextEncoder().encode(
      drawing.svg
    );

  const assetId =
    SparkMD5.ArrayBuffer.hash(
      bytes.buffer
    );

  const md5ext =
    `${assetId}.svg`;

  return {
    costume: {
      assetId,
      name: drawing.name,
      bitmapResolution: 1,
      md5ext,
      dataFormat: "svg",
      rotationCenterX:
        drawing.rotationCenterX,
      rotationCenterY:
        drawing.rotationCenterY
    },
    asset: {
      md5ext,
      bytes
    }
  };
}

export function attachCostume(
  target: ScratchTarget,
  generated: GeneratedCostume
): void {
  target.costumes ??= [];
  target.costumes.push(
    generated.costume
  );
}

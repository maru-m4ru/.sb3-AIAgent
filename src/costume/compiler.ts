import type {
  ScratchAsset,
  ScratchTarget
} from "../core/types";
import type {
  CostumeShape,
  CostumeSpec
} from "./spec";
import {
  addCircle,
  addEllipse,
  addLine,
  addPolygon,
  addRect,
  addText,
  createSvgCanvas
} from "./drawing";
import {
  attachCostume,
  buildSvgCostume
} from "./sb3";

export function compileCostumes(
  target: ScratchTarget,
  specs: CostumeSpec[]
): ScratchAsset[] {
  const assets: ScratchAsset[] = [];

  for (const spec of specs) {
    const canvas =
      createSvgCanvas(
        spec.width,
        spec.height
      );

    for (const shape of spec.shapes) {
      drawShape(
        canvas,
        shape
      );
    }

    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width}" height="${spec.height}" viewBox="0 0 ${spec.width} ${spec.height}">`,
      ...canvas.elements,
      "</svg>"
    ].join("");

    const generated =
      buildSvgCostume({
        name: spec.name,
        width: spec.width,
        height: spec.height,
        rotationCenterX:
          spec.rotationCenterX,
        rotationCenterY:
          spec.rotationCenterY,
        svg
      });

    attachCostume(
      target,
      generated
    );

    assets.push(
      generated.asset
    );
  }

  return assets;
}

function drawShape(
  canvas: ReturnType<typeof createSvgCanvas>,
  shape: CostumeShape
): void {
  if (shape.type === "rect") {
    addRect(
      canvas,
      shape.x,
      shape.y,
      shape.width,
      shape.height,
      shape.fill,
      shape.stroke ?? "none",
      shape.strokeWidth ?? 0
    );
    return;
  }

  if (shape.type === "circle") {
    addCircle(
      canvas,
      shape.cx,
      shape.cy,
      shape.radius,
      shape.fill,
      shape.stroke ?? "none",
      shape.strokeWidth ?? 0
    );
    return;
  }

  if (shape.type === "ellipse") {
    addEllipse(
      canvas,
      shape.cx,
      shape.cy,
      shape.rx,
      shape.ry,
      shape.fill,
      shape.stroke ?? "none",
      shape.strokeWidth ?? 0
    );
    return;
  }

  if (shape.type === "line") {
    addLine(
      canvas,
      shape.x1,
      shape.y1,
      shape.x2,
      shape.y2,
      shape.stroke,
      shape.strokeWidth ?? 1
    );
    return;
  }

  if (shape.type === "polygon") {
    addPolygon(
      canvas,
      shape.points,
      shape.fill,
      shape.stroke ?? "none",
      shape.strokeWidth ?? 0
    );
    return;
  }

  addText(
    canvas,
    shape.x,
    shape.y,
    shape.text,
    shape.fill,
    shape.fontSize ?? 24,
    shape.fontFamily ?? "sans-serif"
  );
}

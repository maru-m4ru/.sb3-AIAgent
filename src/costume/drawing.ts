export interface SvgCanvas {
  width: number;
  height: number;
  elements: string[];
}

export interface CostumeDrawing {
  name: string;
  width: number;
  height: number;
  rotationCenterX: number;
  rotationCenterY: number;
  svg: string;
}

export function createSvgCanvas(
  width = 480,
  height = 360
): SvgCanvas {
  return {
    width,
    height,
    elements: []
  };
}

export function addRect(
  canvas: SvgCanvas,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke = "none",
  strokeWidth = 0
): void {
  canvas.elements.push(
    `<rect x="${num(x)}" y="${num(y)}" width="${num(width)}" height="${num(height)}" fill="${safe(fill)}" stroke="${safe(stroke)}" stroke-width="${num(strokeWidth)}"/>`
  );
}

export function addCircle(
  canvas: SvgCanvas,
  cx: number,
  cy: number,
  radius: number,
  fill: string,
  stroke = "none",
  strokeWidth = 0
): void {
  canvas.elements.push(
    `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(radius)}" fill="${safe(fill)}" stroke="${safe(stroke)}" stroke-width="${num(strokeWidth)}"/>`
  );
}

export function addEllipse(
  canvas: SvgCanvas,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
  stroke = "none",
  strokeWidth = 0
): void {
  canvas.elements.push(
    `<ellipse cx="${num(cx)}" cy="${num(cy)}" rx="${num(rx)}" ry="${num(ry)}" fill="${safe(fill)}" stroke="${safe(stroke)}" stroke-width="${num(strokeWidth)}"/>`
  );
}

export function addLine(
  canvas: SvgCanvas,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  strokeWidth = 1
): void {
  canvas.elements.push(
    `<line x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" stroke="${safe(stroke)}" stroke-width="${num(strokeWidth)}" stroke-linecap="round"/>`
  );
}

export function addPolygon(
  canvas: SvgCanvas,
  points: Array<{
    x: number;
    y: number;
  }>,
  fill: string,
  stroke = "none",
  strokeWidth = 0
): void {
  const value = points
    .map(
      (point) =>
        `${num(point.x)},${num(point.y)}`
    )
    .join(" ");

  canvas.elements.push(
    `<polygon points="${value}" fill="${safe(fill)}" stroke="${safe(stroke)}" stroke-width="${num(strokeWidth)}"/>`
  );
}

export function addText(
  canvas: SvgCanvas,
  x: number,
  y: number,
  text: string,
  fill: string,
  fontSize = 24,
  fontFamily = "sans-serif"
): void {
  canvas.elements.push(
    `<text x="${num(x)}" y="${num(y)}" fill="${safe(fill)}" font-size="${num(fontSize)}" font-family="${safe(fontFamily)}">${escapeXml(text)}</text>`
  );
}

export function finishSvg(
  canvas: SvgCanvas
): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${num(canvas.width)}" height="${num(canvas.height)}" viewBox="0 0 ${num(canvas.width)} ${num(canvas.height)}">`,
    ...canvas.elements,
    "</svg>"
  ].join("");
}

export function createCostumeDrawing(
  name: string,
  canvas: SvgCanvas,
  rotationCenterX = canvas.width / 2,
  rotationCenterY = canvas.height / 2
): CostumeDrawing {
  return {
    name,
    width: canvas.width,
    height: canvas.height,
    rotationCenterX,
    rotationCenterY,
    svg: finishSvg(canvas)
  };
}

function num(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error(
      "SVG numeric value must be finite."
    );
  }

  return String(
    Number(value.toFixed(4))
  );
}

function safe(value: string): string {
  return escapeXml(value);
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

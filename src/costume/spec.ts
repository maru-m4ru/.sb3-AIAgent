export type CostumeShape =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      fill: string;
      stroke?: string;
      strokeWidth?: number;
    }
  | {
      type: "circle";
      cx: number;
      cy: number;
      radius: number;
      fill: string;
      stroke?: string;
      strokeWidth?: number;
    }
  | {
      type: "ellipse";
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      fill: string;
      stroke?: string;
      strokeWidth?: number;
    }
  | {
      type: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      stroke: string;
      strokeWidth?: number;
    }
  | {
      type: "polygon";
      points: Array<{
        x: number;
        y: number;
      }>;
      fill: string;
      stroke?: string;
      strokeWidth?: number;
    }
  | {
      type: "text";
      x: number;
      y: number;
      text: string;
      fill: string;
      fontSize?: number;
      fontFamily?: string;
    };

export interface CostumeSpec {
  name: string;
  width: number;
  height: number;
  rotationCenterX: number;
  rotationCenterY: number;
  shapes: CostumeShape[];
}

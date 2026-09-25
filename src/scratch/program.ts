export type ScratchOperation =
  | {
      type: "whenFlagClicked";
    }
  | {
      type: "moveSteps";
      steps: number;
    }
  | {
      type: "turnRight";
      degrees: number;
    }
  | {
      type: "goToXY";
      x: number;
      y: number;
    }
  | {
      type: "say";
      message: string;
    }
  | {
      type: "wait";
      seconds: number;
    }
  | {
      type: "setVariable";
      name: string;
      value: string | number;
    }
  | {
      type: "changeVariable";
      name: string;
      value: number;
    }
  | {
      type: "repeat";
      times: number;
      body: ScratchOperation[];
    }
  | {
      type: "forever";
      body: ScratchOperation[];
    };

export interface ScratchScriptSpec {
  target: string;
  operations: ScratchOperation[];
  x?: number;
  y?: number;
}

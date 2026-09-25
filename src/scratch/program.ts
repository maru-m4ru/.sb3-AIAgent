import type {
  CostumeSpec
} from "../costume/spec";
import type {
  PenStateOperation
} from "./extensions/pen";
import type {
  CustomBlockSpec
} from "./custom-blocks";

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
    }
  | {
      type: "customDefinition";
      definition: CustomBlockSpec;
    }
  | {
      type: "customCall";
      proccode: string;
      argumentInputs: Record<
        string,
        string | number | boolean
      >;
      warp?: boolean;
    }
  | PenStateOperation;

export interface ScratchScriptSpec {
  target: string;
  operations: ScratchOperation[];
  costumes?: CostumeSpec[];
  x?: number;
  y?: number;
}

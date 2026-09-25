import type { ScratchBlock } from "../../core/types";
import { ScratchBlockFactory } from "../block-factory";

export const PEN_EXTENSION_ID = "pen";

export interface PenStateOperation {
  type:
    | "clear"
    | "stamp"
    | "penDown"
    | "penUp"
    | "setColor"
    | "changeColorParam"
    | "setColorParam"
    | "changeSize"
    | "setSize";
  color?: string;
  parameter?:
    | "color"
    | "saturation"
    | "brightness"
    | "transparency";
  value?: number;
}

export function createPenBlock(
  factory: ScratchBlockFactory,
  operation: PenStateOperation
): {
  id: string;
  block: ScratchBlock;
} {
  if (operation.type === "clear") {
    return factory.create(
      "pen_clear"
    );
  }

  if (operation.type === "stamp") {
    return factory.create(
      "pen_stamp"
    );
  }

  if (operation.type === "penDown") {
    return factory.create(
      "pen_penDown"
    );
  }

  if (operation.type === "penUp") {
    return factory.create(
      "pen_penUp"
    );
  }

  if (operation.type === "setColor") {
    const result = factory.create(
      "pen_setPenColorToColor"
    );

    result.block.inputs = {
      COLOR: factory.text(
        operation.color ?? "#000000"
      )
    };

    return result;
  }

  if (operation.type === "changeColorParam") {
    const result = factory.create(
      "pen_changePenColorParamBy"
    );

    result.block.inputs = {
      COLOR_PARAM: factory.text(
        operation.parameter ?? "color"
      ),
      VALUE: factory.number(
        operation.value ?? 10
      )
    };

    return result;
  }

  if (operation.type === "setColorParam") {
    const result = factory.create(
      "pen_setPenColorParamTo"
    );

    result.block.inputs = {
      COLOR_PARAM: factory.text(
        operation.parameter ?? "color"
      ),
      VALUE: factory.number(
        operation.value ?? 50
      )
    };

    return result;
  }

  if (operation.type === "changeSize") {
    const result = factory.create(
      "pen_changePenSizeBy"
    );

    result.block.inputs = {
      SIZE: factory.number(
        operation.value ?? 1
      )
    };

    return result;
  }

  const result = factory.create(
    "pen_setPenSizeTo"
  );

  result.block.inputs = {
    SIZE: factory.number(
      operation.value ?? 1
    )
  };

  return result;
}

import type { ScratchBlock } from "../core/types";

type PrimitiveInput = [number, string | number];
type BlockInput =
  | [1, PrimitiveInput]
  | [2, string]
  | [3, string];

export class ScratchBlockFactory {
  private counter = 0;

  private nextId(): string {
    this.counter += 1;
    return `sb3ai-${this.counter}`;
  }

  create(
    opcode: string,
    topLevel = false,
    x = 0,
    y = 0
  ): {
    id: string;
    block: ScratchBlock;
  } {
    const id = this.nextId();

    return {
      id,
      block: {
        opcode,
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel,
        x,
        y
      }
    };
  }

  text(value: string): [1, [10, string]] {
    return [1, [10, value]];
  }

  number(value: number | string): [1, [4, string]] {
    return [1, [4, String(value)]];
  }

  integer(value: number | string): [1, [6, string]] {
    return [1, [6, String(value)]];
  }

  substack(blockId: string): [2, string] {
    return [2, blockId];
  }

  setVariable(
    block: ScratchBlock,
    name: string,
    variableId: string,
    value: string | number
  ): void {
    block.fields = {
      VARIABLE: [name, variableId]
    };

    block.inputs = {
      VALUE: this.text(String(value))
    } satisfies Record<string, BlockInput>;
  }

  changeVariable(
    block: ScratchBlock,
    name: string,
    variableId: string,
    value: number
  ): void {
    block.fields = {
      VARIABLE: [name, variableId]
    };

    block.inputs = {
      VALUE: this.number(value)
    } satisfies Record<string, BlockInput>;
  }

  moveSteps(
    block: ScratchBlock,
    steps: number
  ): void {
    block.inputs = {
      STEPS: this.number(steps)
    };
  }

  turnRight(
    block: ScratchBlock,
    degrees: number
  ): void {
    block.inputs = {
      DEGREES: this.number(degrees)
    };
  }

  goToXY(
    block: ScratchBlock,
    x: number,
    y: number
  ): void {
    block.inputs = {
      X: this.number(x),
      Y: this.number(y)
    };
  }

  say(
    block: ScratchBlock,
    message: string
  ): void {
    block.inputs = {
      MESSAGE: this.text(message)
    };
  }

  wait(
    block: ScratchBlock,
    seconds: number
  ): void {
    block.inputs = {
      DURATION: [1, [5, String(seconds)]]
    };
  }

  repeat(
    block: ScratchBlock,
    times: number,
    bodyFirstBlockId: string
  ): void {
    block.inputs = {
      TIMES: this.integer(times),
      SUBSTACK: this.substack(bodyFirstBlockId)
    };
  }

  forever(
    block: ScratchBlock,
    bodyFirstBlockId: string
  ): void {
    block.inputs = {
      SUBSTACK: this.substack(bodyFirstBlockId)
    };
  }
}

import type { ScratchBlock } from "../core/types";
import { ScratchBlockFactory } from "./block-factory";
import type { ScratchOperation } from "./program";

export type CustomArgumentType =
  | "string"
  | "boolean";

export interface CustomArgumentSpec {
  id: string;
  name: string;
  type: CustomArgumentType;
  defaultValue: string | boolean;
}

export interface CustomBlockSpec {
  name: string;
  arguments: CustomArgumentSpec[];
  warp: boolean;
  body: ScratchOperation[];
}

export interface CustomBlockCompileResult {
  definitionId: string;
  blocks: Record<string, ScratchBlock>;
  argumentIds: Map<string, string>;
  proccode: string;
}

export function compileCustomBlock(
  factory: ScratchBlockFactory,
  spec: CustomBlockSpec,
  compileBody: (
    operations: ScratchOperation[],
    argumentIds: Map<string, string>
  ) => {
    firstId: string;
    lastId: string;
    blocks: Record<string, ScratchBlock>;
  }
): CustomBlockCompileResult {
  const definition =
    factory.create(
      "procedures_definition",
      true
    );

  const prototype =
    factory.create(
      "procedures_prototype"
    );

  prototype.block.shadow = true;
  prototype.block.parent =
    definition.id;

  const argumentIds =
    new Map<string, string>();

  for (const argument of spec.arguments) {
    argumentIds.set(
      argument.name,
      argument.id
    );
  }

  const proccode = [
    spec.name,
    ...spec.arguments.map(
      (argument) =>
        argument.type === "boolean"
          ? "%b"
          : "%s"
    )
  ].join(" ");

  prototype.block.mutation = {
    tagName: "mutation",
    children: [],
    proccode,
    argumentids: JSON.stringify(
      spec.arguments.map(
        (argument) => argument.id
      )
    ),
    warp: String(spec.warp),
    argumentnames: JSON.stringify(
      spec.arguments.map(
        (argument) => argument.name
      )
    ),
    argumentdefaults: JSON.stringify(
      spec.arguments.map(
        (argument) => argument.defaultValue
      )
    )
  };

  definition.block.inputs = {
    custom_block: [
      1,
      prototype.id
    ]
  };

  const body = compileBody(
    spec.body,
    argumentIds
  );

  const blocks: Record<
    string,
    ScratchBlock
  > = {
    [definition.id]: definition.block,
    [prototype.id]: prototype.block,
    ...body.blocks
  };

  if (body.firstId) {
    definition.block.next =
      body.firstId;

    blocks[body.firstId].parent =
      definition.id;
  }

  return {
    definitionId: definition.id,
    blocks,
    argumentIds,
    proccode
  };
}

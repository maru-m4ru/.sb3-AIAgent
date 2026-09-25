import type {
  ScratchProjectJson,
  ScratchTarget
} from "../core/types";

export interface ScratchBlockIR {
  id: string;
  opcode: string;
  next: string | null;
  parent: string | null;
  inputs: Record<string, unknown>;
  fields: Record<string, unknown>;
  topLevel: boolean;
  x?: number;
  y?: number;
}

export interface ScratchTargetIR {
  name: string;
  isStage: boolean;
  blocks: ScratchBlockIR[];
  variables: Array<{
    id: string;
    name: string;
    value: string | number;
  }>;
  lists: Array<{
    id: string;
    name: string;
    items: unknown[];
  }>;
  broadcasts: Array<{
    id: string;
    name: string;
  }>;
  costumes: string[];
  sounds: string[];
}

export interface ScratchProjectIR {
  targets: ScratchTargetIR[];
  extensions: string[];
}

export function toScratchIR(
  project: ScratchProjectJson
): ScratchProjectIR {
  return {
    targets: project.targets.map(toTargetIR),
    extensions: project.extensions ?? []
  };
}

function toTargetIR(
  target: ScratchTarget
): ScratchTargetIR {
  return {
    name: target.name,
    isStage: target.isStage,
    blocks: Object.entries(target.blocks).map(([id, block]) => ({
      id,
      opcode: typeof block.opcode === "string"
        ? block.opcode
        : "",
      next: block.next ?? null,
      parent: block.parent ?? null,
      inputs: block.inputs ?? {},
      fields: block.fields ?? {},
      topLevel: block.topLevel === true,
      x: block.x,
      y: block.y
    })),
    variables: Object.entries(target.variables ?? {}).map(
      ([id, value]) => ({
        id,
        name: value[0],
        value: value[1]
      })
    ),
    lists: Object.entries(target.lists ?? {}).map(
      ([id, value]) => ({
        id,
        name: value[0],
        items: value[1]
      })
    ),
    broadcasts: Object.entries(target.broadcasts ?? {}).map(
      ([id, name]) => ({
        id,
        name
      })
    ),
    costumes: (target.costumes ?? [])
      .map((costume) => (
        typeof costume.name === "string"
          ? costume.name
          : ""
      )),
    sounds: (target.sounds ?? [])
      .map((sound) => (
        typeof sound.name === "string"
          ? sound.name
          : ""
      ))
  };
}

import type {
  ScratchBlock,
  ScratchProjectJson,
  ScratchTarget
} from "../core/types";
import { ScratchBlockFactory } from "./block-factory";
import type {
  ScratchOperation,
  ScratchScriptSpec
} from "./program";

interface CompiledScript {
  firstId: string;
  lastId: string;
  blocks: Record<string, ScratchBlock>;
}

interface VariableRef {
  id: string;
  name: string;
}

export function applyScratchProgram(
  project: ScratchProjectJson,
  script: ScratchScriptSpec
): ScratchProjectJson {
  const target = findTarget(project, script.target);
  const factory = new ScratchBlockFactory();
  const variableIds = new Map<string, VariableRef>();

  const compiled = compileOperations(
    factory,
    script.operations,
    variableIds
  );

  mergeBlocks(target, compiled.blocks);
  placeTopLevelScript(
    target,
    compiled.firstId,
    script.x ?? 80,
    script.y ?? 60
  );

  ensureVariables(
    project,
    variableIds
  );

  return project;
}

function findTarget(
  project: ScratchProjectJson,
  name: string
): ScratchTarget {
  const target = project.targets.find(
    (candidate) => candidate.name === name
  );

  if (!target) {
    throw new Error(`Scratch target not found: ${name}`);
  }

  return target;
}

function compileOperations(
  factory: ScratchBlockFactory,
  operations: ScratchOperation[],
  variableIds: Map<string, VariableRef>
): CompiledScript {
  const blocks: Record<string, ScratchBlock> = {};
  let firstId = "";
  let lastId = "";

  for (const operation of operations) {
    if (operation.type === "repeat") {
      const nested = compileOperations(
        factory,
        operation.body,
        variableIds
      );

      if (!nested.firstId) {
        throw new Error("A repeat block requires a non-empty body.");
      }

      const result = factory.create("control_repeat");
      factory.repeat(
        result.block,
        operation.times,
        nested.firstId
      );

      nested.blocks[nested.firstId].parent = result.id;
      blocks[result.id] = result.block;

      for (const [id, block] of Object.entries(nested.blocks)) {
        blocks[id] = block;
      }

      append(
        blocks,
        {
          firstId: result.id,
          lastId: result.id,
          blocks: {}
        },
        {
          firstId: result.id,
          lastId: result.id,
          blocks: {}
        }
      );

      const script = {
        firstId: result.id,
        lastId: result.id,
        blocks
      };

      return appendCompiledScript(
        script,
        {
          firstId: nested.firstId,
          lastId: nested.lastId,
          blocks: {}
        },
        blocks
      );
    }

    if (operation.type === "forever") {
      const nested = compileOperations(
        factory,
        operation.body,
        variableIds
      );

      if (!nested.firstId) {
        throw new Error("A forever block requires a non-empty body.");
      }

      const result = factory.create("control_forever");

      factory.forever(
        result.block,
        nested.firstId
      );

      nested.blocks[nested.firstId].parent = result.id;
      blocks[result.id] = result.block;

      for (const [id, block] of Object.entries(nested.blocks)) {
        blocks[id] = block;
      }

      return appendCompiledScript(
        {
          firstId: result.id,
          lastId: result.id,
          blocks
        },
        {
          firstId: nested.firstId,
          lastId: nested.lastId,
          blocks: {}
        },
        blocks
      );
    }

    const created = compileSimpleOperation(
      factory,
      operation,
      variableIds
    );

    blocks[created.id] = created.block;

    if (!firstId) {
      firstId = created.id;
    }

    if (lastId) {
      blocks[lastId].next = created.id;
      created.block.parent = lastId;
    }

    lastId = created.id;
  }

  return {
    firstId,
    lastId,
    blocks
  };
}

function compileSimpleOperation(
  factory: ScratchBlockFactory,
  operation: Exclude<
    ScratchOperation,
    {
      type: "repeat";
    } | {
      type: "forever";
    }
  >,
  variableIds: Map<string, VariableRef>
): {
  id: string;
  block: ScratchBlock;
} {
  if (operation.type === "whenFlagClicked") {
    return factory.create(
      "event_whenflagclicked"
    );
  }

  if (operation.type === "moveSteps") {
    const result = factory.create(
      "motion_movesteps"
    );

    factory.moveSteps(
      result.block,
      operation.steps
    );

    return result;
  }

  if (operation.type === "turnRight") {
    const result = factory.create(
      "motion_turnright"
    );

    factory.turnRight(
      result.block,
      operation.degrees
    );

    return result;
  }

  if (operation.type === "goToXY") {
    const result = factory.create(
      "motion_gotoxy"
    );

    factory.goToXY(
      result.block,
      operation.x,
      operation.y
    );

    return result;
  }

  if (operation.type === "say") {
    const result = factory.create(
      "looks_say"
    );

    factory.say(
      result.block,
      operation.message
    );

    return result;
  }

  if (operation.type === "wait") {
    const result = factory.create(
      "control_wait"
    );

    factory.wait(
      result.block,
      operation.seconds
    );

    return result;
  }

  const variable = getVariableRef(
    variableIds,
    operation.name
  );

  const result = factory.create(
    operation.type === "setVariable"
      ? "data_setvariableto"
      : "data_changevariableby"
  );

  if (operation.type === "setVariable") {
    factory.setVariable(
      result.block,
      variable.name,
      variable.id,
      operation.value
    );
  } else {
    factory.changeVariable(
      result.block,
      variable.name,
      variable.id,
      operation.value
    );
  }

  return result;
}

function getVariableRef(
  variables: Map<string, VariableRef>,
  name: string
): VariableRef {
  const existing = variables.get(name);

  if (existing) {
    return existing;
  }

  const ref = {
    name,
    id: `var-${variables.size + 1}`
  };

  variables.set(name, ref);

  return ref;
}

function ensureVariables(
  project: ScratchProjectJson,
  variables: Map<string, VariableRef>
): void {
  if (variables.size === 0) {
    return;
  }

  const stage = project.targets.find(
    (target) => target.isStage
  );

  if (!stage) {
    throw new Error("Scratch project has no Stage target.");
  }

  stage.variables ??= {};

  for (const variable of variables.values()) {
    stage.variables[variable.id] ??= [
      variable.name,
      0
    ];
  }
}

function mergeBlocks(
  target: ScratchTarget,
  blocks: Record<string, ScratchBlock>
): void {
  for (const [id, block] of Object.entries(blocks)) {
    target.blocks[id] = block;
  }
}

function placeTopLevelScript(
  target: ScratchTarget,
  firstId: string,
  x: number,
  y: number
): void {
  const block = target.blocks[firstId];

  if (!block) {
    throw new Error("Compiled script has no first block.");
  }

  block.topLevel = true;
  block.parent = null;
  block.x = x;
  block.y = y;
}

function append(
  blocks: Record<string, ScratchBlock>,
  current: CompiledScript,
  next: CompiledScript
): void {
  if (!current.lastId || !next.firstId) {
    return;
  }

  blocks[current.lastId].next = next.firstId;
  blocks[next.firstId].parent = current.lastId;
}

function appendCompiledScript(
  current: CompiledScript,
  nested: CompiledScript,
  blocks: Record<string, ScratchBlock>
): CompiledScript {
  if (nested.firstId) {
    for (const [id, block] of Object.entries(nested.blocks)) {
      blocks[id] = block;
    }
  }

  return current;
}

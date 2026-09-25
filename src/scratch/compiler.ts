import type {
  ScratchBlock,
  ScratchProjectJson,
  ScratchTarget
} from "../core/types";
import {
  compileCustomBlock
} from "./custom-blocks";
import {
  createPenBlock,
  PEN_EXTENSION_ID,
  type PenStateOperation
} from "./extensions/pen";
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
  const target = findTarget(
    project,
    script.target
  );

  const factory =
    new ScratchBlockFactory();

  const variableIds =
    new Map<string, VariableRef>();

  const compiled =
    compileOperations(
      factory,
      script.operations,
      variableIds
    );

  if (!compiled.firstId) {
    throw new Error(
      "Scratch program is empty."
    );
  }

  mergeBlocks(
    target,
    compiled.blocks
  );

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

  if (
    containsPenOperation(
      script.operations
    )
  ) {
    project.extensions ??= [];

    if (
      !project.extensions.includes(
        PEN_EXTENSION_ID
      )
    ) {
      project.extensions.push(
        PEN_EXTENSION_ID
      );
    }
  }

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
    throw new Error(
      `Scratch target not found: ${name}`
    );
  }

  return target;
}

function compileOperations(
  factory: ScratchBlockFactory,
  operations: ScratchOperation[],
  variableIds: Map<string, VariableRef>
): CompiledScript {
  const result: CompiledScript = {
    firstId: "",
    lastId: "",
    blocks: {}
  };

  for (const operation of operations) {
    if (
      operation.type ===
      "customDefinition"
    ) {
      const custom =
        compileCustomBlock(
          factory,
          operation.definition,
          (
            body,
            argumentIds
          ) => compileOperations(
            factory,
            body,
            variableIds
          )
        );

      mergeCompiled(
        result,
        {
          firstId: "",
          lastId: "",
          blocks: custom.blocks
        }
      );

      continue;
    }

    const compiled =
      compileOperation(
        factory,
        operation,
        variableIds
      );

    mergeCompiled(
      result,
      compiled
    );
  }

  return result;
}

function compileOperation(
  factory: ScratchBlockFactory,
  operation: Exclude<
    ScratchOperation,
    {
      type: "customDefinition";
    }
  >,
  variableIds: Map<string, VariableRef>
): CompiledScript {
  if (
    operation.type === "repeat" ||
    operation.type === "forever"
  ) {
    const nested =
      compileOperations(
        factory,
        operation.body,
        variableIds
      );

    if (!nested.firstId) {
      throw new Error(
        `${operation.type} requires a non-empty body.`
      );
    }

    const result =
      factory.create(
        operation.type === "repeat"
          ? "control_repeat"
          : "control_forever"
      );

    if (
      operation.type === "repeat"
    ) {
      factory.repeat(
        result.block,
        operation.times,
        nested.firstId
      );
    } else {
      factory.forever(
        result.block,
        nested.firstId
      );
    }

    nested.blocks[
      nested.firstId
    ].parent = result.id;

    return {
      firstId: result.id,
      lastId: result.id,
      blocks: {
        [result.id]: result.block,
        ...nested.blocks
      }
    };
  }

  if (
    operation.type === "customCall"
  ) {
    return compileCustomCall(
      factory,
      operation.proccode,
      operation.argumentInputs,
      operation.warp ?? false
    );
  }

  if (
    isPenOperation(
      operation
    )
  ) {
    const result =
      createPenBlock(
        factory,
        operation
      );

    return {
      firstId: result.id,
      lastId: result.id,
      blocks: {
        [result.id]:
          result.block
      }
    };
  }

  const result =
    compileSimpleOperation(
      factory,
      operation,
      variableIds
    );

  return {
    firstId: result.id,
    lastId: result.id,
    blocks: {
      [result.id]:
        result.block
    }
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
    } | {
      type: "customDefinition";
    } | {
      type: "customCall";
    } | PenStateOperation
  >,
  variableIds: Map<string, VariableRef>
): {
  id: string;
  block: ScratchBlock;
} {
  if (
    operation.type ===
    "whenFlagClicked"
  ) {
    return factory.create(
      "event_whenflagclicked"
    );
  }

  if (
    operation.type ===
    "moveSteps"
  ) {
    const result =
      factory.create(
        "motion_movesteps"
      );

    factory.moveSteps(
      result.block,
      operation.steps
    );

    return result;
  }

  if (
    operation.type ===
    "turnRight"
  ) {
    const result =
      factory.create(
        "motion_turnright"
      );

    factory.turnRight(
      result.block,
      operation.degrees
    );

    return result;
  }

  if (
    operation.type ===
    "goToXY"
  ) {
    const result =
      factory.create(
        "motion_gotoxy"
      );

    factory.goToXY(
      result.block,
      operation.x,
      operation.y
    );

    return result;
  }

  if (
    operation.type ===
    "say"
  ) {
    const result =
      factory.create(
        "looks_say"
      );

    factory.say(
      result.block,
      operation.message
    );

    return result;
  }

  if (
    operation.type ===
    "wait"
  ) {
    const result =
      factory.create(
        "control_wait"
      );

    factory.wait(
      result.block,
      operation.seconds
    );

    return result;
  }

  const variable =
    getVariableRef(
      variableIds,
      operation.name
    );

  const result =
    factory.create(
      operation.type ===
        "setVariable"
        ? "data_setvariableto"
        : "data_changevariableby"
    );

  if (
    operation.type ===
    "setVariable"
  ) {
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

function compileCustomCall(
  factory: ScratchBlockFactory,
  proccode: string,
  argumentInputs: Record<
    string,
    string | number | boolean
  >,
  warp: boolean
): CompiledScript {
  const result =
    factory.create(
      "procedures_call"
    );

  result.block.mutation = {
    tagName: "mutation",
    children: [],
    proccode,
    argumentids: JSON.stringify(
      Object.keys(argumentInputs)
    ),
    warp: String(warp)
  };

  result.block.inputs = {};

  for (
    const [argumentId, value]
    of Object.entries(argumentInputs)
  ) {
    if (
      typeof value ===
      "boolean"
    ) {
      throw new Error(
        "Boolean custom block literals require a reporter block."
      );
    }

    result.block.inputs[
      argumentId
    ] = typeof value === "number"
      ? factory.number(value)
      : factory.text(value);
  }

  return {
    firstId: result.id,
    lastId: result.id,
    blocks: {
      [result.id]:
        result.block
    }
  };
}

function mergeCompiled(
  target: CompiledScript,
  source: CompiledScript
): void {
  for (
    const [id, block]
    of Object.entries(
      source.blocks
    )
  ) {
    target.blocks[id] =
      block;
  }

  if (
    !source.firstId
  ) {
    return;
  }

  if (
    !target.firstId
  ) {
    target.firstId =
      source.firstId;
    target.lastId =
      source.lastId;
    return;
  }

  target.blocks[
    target.lastId
  ].next =
    source.firstId;

  target.blocks[
    source.firstId
  ].parent =
    target.lastId;

  target.lastId =
    source.lastId;
}

function getVariableRef(
  variables: Map<string, VariableRef>,
  name: string
): VariableRef {
  const existing =
    variables.get(name);

  if (existing) {
    return existing;
  }

  const ref = {
    name,
    id: `var-${variables.size + 1}`
  };

  variables.set(
    name,
    ref
  );

  return ref;
}

function ensureVariables(
  project: ScratchProjectJson,
  variables: Map<string, VariableRef>
): void {
  if (
    variables.size === 0
  ) {
    return;
  }

  const stage =
    project.targets.find(
      (target) =>
        target.isStage
    );

  if (!stage) {
    throw new Error(
      "Scratch project has no Stage target."
    );
  }

  stage.variables ??= {};

  for (
    const variable
    of variables.values()
  ) {
    stage.variables[
      variable.id
    ] ??= [
      variable.name,
      0
    ];
  }
}

function mergeBlocks(
  target: ScratchTarget,
  blocks: Record<string, ScratchBlock>
): void {
  for (
    const [id, block]
    of Object.entries(blocks)
  ) {
    target.blocks[id] =
      block;
  }
}

function placeTopLevelScript(
  target: ScratchTarget,
  firstId: string,
  x: number,
  y: number
): void {
  const block =
    target.blocks[firstId];

  if (!block) {
    throw new Error(
      "Compiled script has no first block."
    );
  }

  block.topLevel = true;
  block.parent = null;
  block.x = x;
  block.y = y;
}

function containsPenOperation(
  operations: ScratchOperation[]
): boolean {
  return operations.some(
    (operation) => {
      if (
        operation.type ===
        "customDefinition"
      ) {
        return containsPenOperation(
          operation.definition.body
        );
      }

      if (
        operation.type ===
        "repeat" ||
        operation.type ===
        "forever"
      ) {
        return containsPenOperation(
          operation.body
        );
      }

      return isPenOperation(
        operation
      );
    }
  );
}

function isPenOperation(
  operation: ScratchOperation
): operation is PenStateOperation {
  return [
    "clear",
    "stamp",
    "penDown",
    "penUp",
    "setColor",
    "changeColorParam",
    "setColorParam",
    "changeSize",
    "setSize"
  ].includes(
    operation.type
  );
}

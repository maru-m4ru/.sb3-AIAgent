import type {
  ScratchBlock,
  ScratchProjectJson,
  ScratchTarget
} from "../core/types";

export interface ScratchValidationIssue {
  level: "error" | "warning";
  message: string;
  target?: string;
  blockId?: string;
}

export interface ScratchValidationResult {
  valid: boolean;
  issues: ScratchValidationIssue[];
}

export function validateScratchProject(
  project: ScratchProjectJson
): ScratchValidationResult {
  const issues: ScratchValidationIssue[] = [];

  if (!Array.isArray(project.targets)) {
    return {
      valid: false,
      issues: [
        {
          level: "error",
          message: "project.targets must be an array."
        }
      ]
    };
  }

  const stageCount = project.targets.filter(
    (target) => target.isStage
  ).length;

  if (stageCount !== 1) {
    issues.push({
      level: "error",
      message:
        "A Scratch project must contain exactly one Stage target."
    });
  }

  for (const target of project.targets) {
    validateTarget(
      target,
      issues
    );
  }

  return {
    valid: !issues.some(
      (issue) => issue.level === "error"
    ),
    issues
  };
}

function validateTarget(
  target: ScratchTarget,
  issues: ScratchValidationIssue[]
): void {
  if (
    typeof target.name !== "string" ||
    !target.name
  ) {
    issues.push({
      level: "error",
      message: "Target name is missing."
    });
  }

  if (
    typeof target.blocks !== "object" ||
    target.blocks === null ||
    Array.isArray(target.blocks)
  ) {
    issues.push({
      level: "error",
      message: "Target blocks must be an object.",
      target: target.name
    });

    return;
  }

  const blocks =
    target.blocks as Record<
      string,
      ScratchBlock
    >;

  for (const [id, block] of Object.entries(blocks)) {
    validateBlock(
      target.name,
      id,
      block,
      blocks,
      issues
    );
  }

  validateVariables(
    target,
    issues
  );
}

function validateBlock(
  targetName: string,
  id: string,
  block: ScratchBlock,
  blocks: Record<string, ScratchBlock>,
  issues: ScratchValidationIssue[]
): void {
  if (
    typeof block.opcode !== "string" ||
    !block.opcode
  ) {
    issues.push({
      level: "error",
      message: "Block opcode is missing.",
      target: targetName,
      blockId: id
    });
  }

  if (
    block.next !== null &&
    block.next !== undefined
  ) {
    if (
      typeof block.next !== "string" ||
      !blocks[block.next]
    ) {
      issues.push({
        level: "error",
        message: "Block next reference is invalid.",
        target: targetName,
        blockId: id
      });
    }
  }

  if (
    block.parent !== null &&
    block.parent !== undefined
  ) {
    if (
      typeof block.parent !== "string" ||
      !blocks[block.parent]
    ) {
      issues.push({
        level: "error",
        message: "Block parent reference is invalid.",
        target: targetName,
        blockId: id
      });
    }
  }

  if (
    block.inputs === undefined ||
    typeof block.inputs !== "object" ||
    block.inputs === null ||
    Array.isArray(block.inputs)
  ) {
    issues.push({
      level: "error",
      message: "Block inputs must be an object.",
      target: targetName,
      blockId: id
    });
  }

  if (
    block.fields === undefined ||
    typeof block.fields !== "object" ||
    block.fields === null ||
    Array.isArray(block.fields)
  ) {
    issues.push({
      level: "error",
      message: "Block fields must be an object.",
      target: targetName,
      blockId: id
    });
  }
}

function validateVariables(
  target: ScratchTarget,
  issues: ScratchValidationIssue[]
): void {
  for (const [id, value] of Object.entries(
    target.variables ?? {}
  )) {
    if (
      !Array.isArray(value) ||
      value.length !== 2 ||
      typeof value[0] !== "string"
    ) {
      issues.push({
        level: "error",
        message:
          `Variable ${id} has an invalid representation.`,
        target: target.name
      });
    }
  }
}

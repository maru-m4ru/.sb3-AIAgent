import type {
  AgentVerdict
} from "../core/types";
import type {
  ScratchPlan
} from "./protocol";
import type {
  ScratchOperation,
  ScratchScriptSpec
} from "../scratch/program";

const VALID_VERDICTS: AgentVerdict[] = [
  "ALLOW",
  "OPPOSE",
  "UNCERTAIN"
];

export interface ScratchGenerationPlan {
  verdict: AgentVerdict;
  goal: string;
  script: ScratchScriptSpec;
}

export function validateGenerationPlan(
  value: unknown
): ScratchGenerationPlan {
  if (!isRecord(value)) {
    throw new Error("Agent plan must be an object.");
  }

  const verdict = value.verdict;

  if (
    typeof verdict !== "string" ||
    !VALID_VERDICTS.includes(verdict as AgentVerdict)
  ) {
    throw new Error(
      "Agent plan has an invalid verdict."
    );
  }

  if (
    typeof value.goal !== "string" ||
    !value.goal.trim()
  ) {
    throw new Error(
      "Agent plan requires a goal."
    );
  }

  if (!isRecord(value.script)) {
    throw new Error(
      "Agent plan requires a script."
    );
  }

  const target = value.script.target;
  const operations = value.script.operations;

  if (
    typeof target !== "string" ||
    !target.trim() ||
    !Array.isArray(operations)
  ) {
    throw new Error(
      "Agent script is invalid."
    );
  }

  return {
    verdict: verdict as AgentVerdict,
    goal: value.goal,
    script: {
      target,
      operations: operations as ScratchOperation[],
      x: typeof value.script.x === "number"
        ? value.script.x
        : undefined,
      y: typeof value.script.y === "number"
        ? value.script.y
        : undefined
    }
  };
}

export function toScratchPlan(
  plan: ScratchGenerationPlan
): ScratchPlan {
  return {
    verdict: plan.verdict,
    goal: plan.goal,
    changes: [
      {
        target: plan.script.target,
        action: "modify",
        description: "Apply validated Scratch operations."
      }
    ],
    validation: [
      {
        description: "Build project.json and package assets into .sb3."
      }
    ]
  };
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

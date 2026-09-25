import type { AgentVerdict } from "../core/types";
import type { ScratchGenerationPlan } from "./plan-validator";
import type { ScratchOperation } from "../scratch/program";

export function planScratchRequest(
  request: string
): ScratchGenerationPlan {
  const text = request.trim();

  if (!text) {
    throw new Error(
      "Generation request is empty."
    );
  }

  const feasibility = detectHardLimit(text);

  if (feasibility) {
    return {
      verdict: "OPPOSE",
      goal: text,
      script: {
        target: "Sprite1",
        operations: [
          {
            type: "whenFlagClicked"
          }
        ]
      }
    };
  }

  const operations: ScratchOperation[] = [
    {
      type: "whenFlagClicked"
    }
  ];

  const move = text.match(
    /(-?\d+(?:\.\d+)?)\s*歩/
  );

  if (move) {
    operations.push({
      type: "moveSteps",
      steps: Number(move[1])
    });
  }

  const turn = text.match(
    /(?:右|時計回り).*?(-?\d+(?:\.\d+)?)\s*度/
  );

  if (turn) {
    operations.push({
      type: "turnRight",
      degrees: Number(turn[1])
    });
  }

  const wait = text.match(
    /(\d+(?:\.\d+)?)\s*秒.*?待/
  );

  if (wait) {
    operations.push({
      type: "wait",
      seconds: Number(wait[1])
    });
  }

  const say = text.match(
    /(?:「([^」]*)」|"([^"]*)"|'([^']*)').*?(?:と言|話)/
  );

  if (say) {
    operations.push({
      type: "say",
      message: say[1] ?? say[2] ?? say[3] ?? ""
    });
  }

  if (operations.length === 1) {
    operations.push({
      type: "say",
      message: text
    });
  }

  return {
    verdict: "ALLOW",
    goal: text,
    script: {
      target: "Sprite1",
      operations
    }
  };
}

function detectHardLimit(
  request: string
): boolean {
  const patterns = [
    /arbitrary native code/i,
    /execute arbitrary javascript/i,
    /raw tcp socket/i,
    /direct operating system access/i,
    /ローカルファイル.*直接/,
    /任意の.*javascript.*実行/,
    /OS.*直接操作/,
    /TCP.*ソケット.*直接/
  ];

  return patterns.some(
    (pattern) => pattern.test(request)
  );
}

export type { AgentVerdict };

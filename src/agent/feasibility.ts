import type {
  FeasibilityResult
} from "../core/types";

const SCRATCH_LIMITS = [
  /arbitrary native code/i,
  /execute arbitrary javascript/i,
  /access local filesystem/i,
  /raw tcp socket/i,
  /direct operating system access/i
];

export function evaluateScratchFeasibility(
  request: string
): FeasibilityResult {
  const normalized = request.trim();

  if (!normalized) {
    return {
      verdict: "UNCERTAIN",
      reason: "No implementation request was supplied."
    };
  }

  const matched = SCRATCH_LIMITS.find(
    (pattern) => pattern.test(normalized)
  );

  if (matched) {
    return {
      verdict: "OPPOSE",
      reason:
        "The request asks for behavior that is outside normal Scratch project capabilities.",
      evidence: [matched.source]
    };
  }

  return {
    verdict: "ALLOW",
    reason:
      "No Scratch-specific hard limitation was detected by the initial rule set."
  };
}

import type {
  AgentVerdict,
  ScratchProjectId,
  ScratchProjectJson
} from "../core/types";
import type { ScratchProjectIR } from "../scratch/ir";

export interface AgentContext {
  projectId?: ScratchProjectId;
  project?: ScratchProjectJson;
  ir?: ScratchProjectIR;
  request: string;
}

export interface ScratchPlan {
  verdict: AgentVerdict;
  goal: string;
  changes: Array<{
    target?: string;
    action:
      | "create"
      | "modify"
      | "delete"
      | "preserve";
    description: string;
  }>;
  opposition?: {
    reason: string;
    scratchLimitation: string;
  };
  validation: Array<{
    description: string;
  }>;
}

export interface AgentOutput {
  format: "sb3" | "html" | "css" | "python";
  plan: ScratchPlan;
  artifacts: Record<string, string>;
}

// Small shared worker-only types for job status/result semantics.
export type JobStatus = "pending" | "processing" | "done" | "failed";

export interface JobResult {
  success: boolean;
  outputUrl?: string;
  error?: string;
}

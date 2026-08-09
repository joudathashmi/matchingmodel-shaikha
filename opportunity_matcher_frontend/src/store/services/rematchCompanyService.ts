import axiosClient from "../../api/axiosClient";

export type RematchCompanyPayload = {
  companyId?: number;
  companyName?: string;
  fast?: boolean;
  topN?: number;
};

export type RematchCompanyMatch = {
  opportunityId: number;
  opportunityName: string;
  opportunitySector?: string;
  finalScore: number;
  decisionTier?: string;
  aiDecision: string;
  rank: number;
  strengths?: string;
  risks?: string;
  matchReason?: string;
  recommendedEngagement?: string;
};

export type RematchCompanyResult = {
  ok: boolean;
  companyId?: number;
  companyName?: string;
  matchCount?: number;
  matches?: RematchCompanyMatch[];
  error?: string;
  finishedAt?: string;
};

export type RematchJobStatus = {
  jobId: string;
  status: "queued" | "running" | "succeeded" | "failed";
  pct: number;
  stage: string;
  message: string;
  companyId?: number;
  companyName?: string;
  startedAt: string;
  updatedAt: string;
  elapsedMs: number;
  result?: RematchCompanyResult;
  error?: string;
};

export async function startRematchJob(
  payload: RematchCompanyPayload
): Promise<RematchJobStatus> {
  const { data } = await axiosClient.post<RematchJobStatus>(
    "/companies/rematch",
    payload,
    { timeout: 30_000 }
  );
  return data;
}

export async function getRematchJobStatus(
  jobId: string
): Promise<RematchJobStatus> {
  const { data } = await axiosClient.get<RematchJobStatus>(
    `/companies/rematch/${jobId}`,
    { timeout: 15_000 }
  );
  return data;
}

/** Start rematch and poll until finished. onProgress fires each poll. */
export async function rematchCompanyWithProgress(
  payload: RematchCompanyPayload,
  onProgress?: (job: RematchJobStatus) => void
): Promise<RematchJobStatus> {
  const started = await startRematchJob(payload);
  onProgress?.(started);

  const deadline = Date.now() + 16 * 60 * 1000;
  let job = started;
  while (Date.now() < deadline) {
    if (job.status === "succeeded" || job.status === "failed") {
      return job;
    }
    await new Promise((r) => setTimeout(r, 900));
    job = await getRematchJobStatus(started.jobId);
    onProgress?.(job);
  }
  return {
    ...job,
    status: "failed",
    error: "Rematch timed out waiting for progress",
    message: "Timed out",
  };
}

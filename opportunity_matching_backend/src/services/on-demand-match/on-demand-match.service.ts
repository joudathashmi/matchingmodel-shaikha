import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "./../../lib/prisma";


const PROJECT_ROOT = path.resolve(__dirname, "../../../../");
const SCRIPT = path.join(PROJECT_ROOT, "on_demand_match_company.py");
const PYTHON =
  process.env.MATCHING_PYTHON ||
  process.env.PYTHON_BIN ||
  "/opt/anaconda3/bin/python3";

export type RematchRequest = {
  companyId?: number;
  companyName?: string;
  /** Faster: 1-vote gate, skip GPT narratives */
  fast?: boolean;
  topN?: number;
};

export type RematchMatch = {
  opportunityId: number;
  opportunityName: string;
  opportunitySector: string;
  finalScore: number;
  decisionTier: string;
  aiDecision: string;
  rank: number;
  confidenceScore: string;
  strengths: string;
  risks: string;
  matchReason: string;
  recommendedEngagement: string;
};

export type RematchResult = {
  ok: boolean;
  mode?: string;
  fast?: boolean;
  companyId?: number;
  companyName?: string;
  matchCount?: number;
  matches?: RematchMatch[];
  db?: Record<string, unknown>;
  finishedAt?: string;
  error?: string;
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
  result?: RematchResult;
  error?: string;
};

type InternalJob = RematchJobStatus & {
  child?: ChildProcessWithoutNullStreams;
  timer?: NodeJS.Timeout;
};

const jobs = new Map<string, InternalJob>();
const JOB_TTL_MS = 60 * 60 * 1000;

function touch(job: InternalJob, patch: Partial<InternalJob>) {
  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
  job.elapsedMs = Date.now() - new Date(job.startedAt).getTime();
}

function parseProgressLine(line: string): { pct: number; stage: string; message: string } | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("PROGRESS ")) return null;
  try {
    const payload = JSON.parse(trimmed.slice("PROGRESS ".length));
    return {
      pct: Number(payload.pct) || 0,
      stage: String(payload.stage || "running"),
      message: String(payload.message || ""),
    };
  } catch {
    return null;
  }
}

function publicJob(job: InternalJob): RematchJobStatus {
  return {
    jobId: job.jobId,
    status: job.status,
    pct: job.pct,
    stage: job.stage,
    message: job.message,
    companyId: job.companyId,
    companyName: job.companyName,
    startedAt: job.startedAt,
    updatedAt: job.updatedAt,
    elapsedMs: Date.now() - new Date(job.startedAt).getTime(),
    result: job.result,
    error: job.error,
  };
}

async function resolveCompany(input: RematchRequest) {
  const companyId = input.companyId;
  const companyName = input.companyName?.trim();

  if (!companyId && !companyName) {
    return null;
  }

  if (companyId) {
    return prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, company_name: true },
    });
  }

  let resolved = await prisma.company.findFirst({
    where: { company_name: { equals: companyName!, mode: "insensitive" } },
    select: { id: true, company_name: true },
  });
  if (!resolved) {
    resolved = await prisma.company.findFirst({
      where: { company_name: { contains: companyName!, mode: "insensitive" } },
      select: { id: true, company_name: true },
      orderBy: { id: "asc" },
    });
  }
  return resolved;
}

/**
 * Start an on-demand rematch job and return immediately with a jobId.
 * Poll getRematchJob(jobId) for progress.
 */
export async function startRematchJob(
  input: RematchRequest
): Promise<RematchJobStatus> {
  if (!input.companyId && !input.companyName?.trim()) {
    throw Object.assign(new Error("companyId or companyName is required"), {
      status: 400,
    });
  }

  const resolved = await resolveCompany(input);
  if (!resolved) {
    throw Object.assign(
      new Error(
        input.companyId
          ? `Company id=${input.companyId} not found`
          : `No company matching name=${input.companyName}`
      ),
      { status: 404 }
    );
  }

  const jobId = randomUUID();
  const now = new Date().toISOString();
  const job: InternalJob = {
    jobId,
    status: "queued",
    pct: 0,
    stage: "queued",
    message: "Queued on-demand rematch…",
    companyId: resolved.id,
    companyName: resolved.company_name,
    startedAt: now,
    updatedAt: now,
    elapsedMs: 0,
  };
  jobs.set(jobId, job);

  const args = [
    SCRIPT,
    "--company-id",
    String(resolved.id),
    "--top-n",
    String(input.topN && input.topN > 0 ? Math.min(input.topN, 20) : 8),
  ];
  if (input.fast) args.push("--fast");

  const child = spawn(PYTHON, args, {
    cwd: PROJECT_ROOT,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  job.child = child;
  touch(job, {
    status: "running",
    pct: 1,
    stage: "start",
    message: `Starting rematch for ${resolved.company_name}…`,
  });

  let stdout = "";
  let stderrTail = "";

  job.timer = setTimeout(() => {
    child.kill("SIGTERM");
    touch(job, {
      status: "failed",
      pct: job.pct,
      stage: "timeout",
      message: "Rematch timed out",
      error: "On-demand rematch timed out after 15 minutes",
    });
  }, 15 * 60 * 1000);

  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });

  child.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    process.stderr.write(text);
    stderrTail = (stderrTail + text).slice(-4000);
    for (const line of text.split("\n")) {
      const prog = parseProgressLine(line);
      if (prog && job.status === "running") {
        touch(job, {
          pct: Math.max(job.pct, prog.pct),
          stage: prog.stage,
          message: prog.message || job.message,
        });
      }
    }
  });

  child.on("error", (err) => {
    if (job.timer) clearTimeout(job.timer);
    touch(job, {
      status: "failed",
      stage: "error",
      message: "Failed to start Python rematch",
      error: err.message,
    });
  });

  child.on("close", (code) => {
    if (job.timer) clearTimeout(job.timer);
    if (job.status === "failed") return;

    const lines = stdout
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const last = lines[lines.length - 1];
    if (!last) {
      touch(job, {
        status: "failed",
        stage: "error",
        message: "Rematch produced no result",
        error:
          stderrTail.slice(-800) ||
          `Rematch exited with code ${code} and empty stdout`,
      });
      return;
    }
    try {
      const parsed = JSON.parse(last) as RematchResult;
      if (!parsed.ok) {
        touch(job, {
          status: "failed",
          pct: job.pct,
          stage: "error",
          message: parsed.error || "Rematch failed",
          error: parsed.error || "Rematch failed",
          result: parsed,
        });
        return;
      }
      touch(job, {
        status: "succeeded",
        pct: 100,
        stage: "done",
        message: `Done - ${parsed.matchCount ?? 0} matches refreshed`,
        result: parsed,
      });
    } catch {
      touch(job, {
        status: "failed",
        stage: "error",
        message: "Invalid rematch response",
        error: `Invalid rematch JSON (exit ${code}): ${last.slice(0, 400)}`,
      });
    }
  });

  // Cleanup old jobs later
  setTimeout(() => jobs.delete(jobId), JOB_TTL_MS);

  return publicJob(job);
}

export function getRematchJob(jobId: string): RematchJobStatus | null {
  const job = jobs.get(jobId);
  if (!job) return null;
  return publicJob(job);
}

/** Legacy blocking helper (tests / scripts). Prefer startRematchJob. */
export async function rematchCompany(
  input: RematchRequest
): Promise<RematchResult> {
  const started = await startRematchJob(input);
  const deadline = Date.now() + 15 * 60 * 1000;
  while (Date.now() < deadline) {
    const job = getRematchJob(started.jobId);
    if (!job) {
      return { ok: false, error: "Rematch job disappeared" };
    }
    if (job.status === "succeeded" && job.result) return job.result;
    if (job.status === "failed") {
      return {
        ok: false,
        companyId: job.companyId,
        companyName: job.companyName,
        error: job.error || job.message,
      };
    }
    await new Promise((r) => setTimeout(r, 750));
  }
  return { ok: false, error: "Rematch timed out while waiting for job" };
}

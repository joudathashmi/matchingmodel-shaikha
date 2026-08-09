import { saveAs } from "file-saver";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { activeMatchesService } from "../../store/services/filterMatchesService";
import {
  ActiveMatch,
  ActiveMatchesRequest,
} from "../../store/types/filterMatchesTypes";
import {
  humanizeEvidenceFlags,
  scorePercent,
} from "../../common/aiMatchUtils";

const PAGE_SIZE = 100;
const HARD_CAP = 2000;

export type MatchExportFilters = Omit<ActiveMatchesRequest, "page" | "limit">;

export type MatchExportMeta = {
  filters: MatchExportFilters;
  filterSummary: string[];
  exportedAt: Date;
  totalAvailable: number;
  exportedCount: number;
};

function asList(value: string[] | string | null | undefined): string {
  if (Array.isArray(value)) return value.filter(Boolean).join(" · ");
  if (typeof value === "string") return value.trim();
  return "";
}

function stamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

function pct(score?: number | null): string {
  if (score == null || Number.isNaN(score)) return "";
  return `${scorePercent(score)}%`;
}

/** Flatten one match into officer-facing columns. */
export function matchToExportRow(m: ActiveMatch): Record<string, string> {
  return {
    "Match ID": String(m.id ?? ""),
    Rank: m.rank != null ? String(m.rank) : "",
    Company: m.companyName || "",
    "Company sector": m.companySector || "",
    "Company website": m.companyWebsite || "",
    Opportunity: m.opportunityName || "",
    "Opportunity sector": m.opportunitySector || "",
    "Target sector": m.relatedTargetSector || "",
    "Source sectors": (m.relatedSourceSectors || []).join("; "),
    "Decision tier": m.decisionTier || "",
    "AI decision": m.aiDecision || "",
    "Final score": pct(m.finalScore),
    "Sector score": pct(m.sectorSimilarity),
    "Profile score": pct(m.profileSimilarity),
    "Product score": pct(m.productSimilarity),
    "AI score": pct(m.aiScore),
    "Confidence label": m.confidenceLabel || "",
    "Confidence score":
      m.confidenceScore != null ? `${m.confidenceScore}%` : "",
    "Evidence reasons": humanizeEvidenceFlags(m.evidenceFlag).join("; "),
    "Value chain / role": m.valueChainPosition || "",
    "Top strength": (m.strengths || "").trim(),
    "Key risk": (m.risks || "").trim(),
    "Recommended engagement": m.recommendedEngagement || "",
    "Localization model": m.localizationModel || "",
    "Match reasons": asList(m.matchReason),
    "Suggested plan": asList(m.suggestedPlan),
    "Pursuit status": m.userAgreement || "",
    "Model version": m.modelVersion || "",
  };
}

export async function fetchAllFilteredMatches(
  filters: MatchExportFilters,
  onProgress?: (loaded: number, total: number) => void
): Promise<{ matches: ActiveMatch[]; meta: MatchExportMeta }> {
  const first = await activeMatchesService.getActiveMatches({
    ...filters,
    page: 1,
    limit: PAGE_SIZE,
  });
  const totalAvailable = first.meta?.total ?? first.data.length;
  const totalPages = Math.max(
    1,
    Math.min(
      first.meta?.totalPages || 1,
      Math.ceil(Math.min(totalAvailable, HARD_CAP) / PAGE_SIZE)
    )
  );

  const matches = [...first.data];
  onProgress?.(matches.length, Math.min(totalAvailable, HARD_CAP));

  for (let page = 2; page <= totalPages; page += 1) {
    const res = await activeMatchesService.getActiveMatches({
      ...filters,
      page,
      limit: PAGE_SIZE,
    });
    matches.push(...res.data);
    onProgress?.(
      Math.min(matches.length, HARD_CAP),
      Math.min(totalAvailable, HARD_CAP)
    );
    if (matches.length >= HARD_CAP) break;
  }

  const capped = matches.slice(0, HARD_CAP);
  return {
    matches: capped,
    meta: {
      filters,
      filterSummary: buildFilterSummary(filters),
      exportedAt: new Date(),
      totalAvailable,
      exportedCount: capped.length,
    },
  };
}

function buildFilterSummary(filters: MatchExportFilters): string[] {
  const lines: string[] = [];
  if (filters.pursue_only) lines.push("Focus: pursue queue (Excellent · Strong · Good)");
  if (filters.decision_tier) lines.push(`Decision tier contains: ${filters.decision_tier}`);
  if (filters.companies?.length) lines.push(`Companies: ${filters.companies.join(", ")}`);
  if (filters.sectors?.length) lines.push(`Sectors: ${filters.sectors.join(", ")}`);
  if (filters.ai_decision) lines.push(`AI decision: ${filters.ai_decision}`);
  if (filters.final_score) {
    const min = Math.round((filters.final_score.min ?? 0) * 100);
    const max = Math.round((filters.final_score.max ?? 1) * 100);
    lines.push(`Score range: ${min}% – ${max}%`);
  }
  if (!lines.length) lines.push("Filters: all matches in current view defaults");
  return lines;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Excel-friendly UTF-8 CSV (opens cleanly in Excel / Sheets). */
export function downloadMatchesExcelCsv(
  matches: ActiveMatch[],
  meta: MatchExportMeta
) {
  if (!matches.length) throw new Error("No matches to export");
  const rows = matches.map(matchToExportRow);
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h] ?? "")).join(",")),
  ];
  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  saveAs(blob, `match_workbench_${stamp()}.csv`);
  return meta;
}

function cell(text: string, opts?: { bold?: boolean; width?: number }) {
  return new TableCell({
    width: { size: opts?.width || 1400, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "D0D5DD" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "D0D5DD" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "D0D5DD" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "D0D5DD" },
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text || "—",
            bold: opts?.bold,
            size: 16,
            font: "Calibri",
          }),
        ],
      }),
    ],
  });
}

/** Officer briefing Word document with summary + ranked table + narratives. */
export async function downloadMatchesWord(
  matches: ActiveMatch[],
  meta: MatchExportMeta
) {
  if (!matches.length) throw new Error("No matches to export");

  const byTier: Record<string, number> = {};
  for (const m of matches) {
    const t = m.decisionTier || "Unscored";
    byTier[t] = (byTier[t] || 0) + 1;
  }

  const headerRow = new TableRow({
    children: [
      cell("Rank", { bold: true, width: 600 }),
      cell("Company", { bold: true, width: 2200 }),
      cell("Opportunity", { bold: true, width: 2400 }),
      cell("Tier", { bold: true, width: 1400 }),
      cell("Score", { bold: true, width: 700 }),
      cell("Confidence", { bold: true, width: 1100 }),
    ],
  });

  const tableRows = matches.slice(0, 80).map(
    (m) =>
      new TableRow({
        children: [
          cell(String(m.rank ?? ""), { width: 600 }),
          cell(m.companyName || "", { width: 2200 }),
          cell(m.opportunityName || "", { width: 2400 }),
          cell(m.decisionTier || "", { width: 1400 }),
          cell(pct(m.finalScore), { width: 700 }),
          cell(m.confidenceLabel || "", { width: 1100 }),
        ],
      })
  );

  const narrativeBlocks: Paragraph[] = [];
  const detailSlice = matches.slice(0, 40);
  for (const m of detailSlice) {
    narrativeBlocks.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 80 },
        children: [
          new TextRun({
            text: `${m.companyName || "Company"} × ${m.opportunityName || "Opportunity"}`,
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: `${m.decisionTier || "Unscored"} · ${pct(m.finalScore)} · ${
              m.confidenceLabel || "n/a"
            } confidence`,
            italics: true,
            color: "475467",
            size: 18,
          }),
        ],
      })
    );
    if (m.strengths?.trim()) {
      narrativeBlocks.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "Top strength: ", bold: true, size: 18 }),
            new TextRun({ text: m.strengths.trim(), size: 18 }),
          ],
        })
      );
    }
    if (m.risks?.trim()) {
      narrativeBlocks.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "Key risk: ", bold: true, size: 18 }),
            new TextRun({ text: m.risks.trim(), size: 18 }),
          ],
        })
      );
    }
    const reasons = asList(m.matchReason);
    if (reasons) {
      narrativeBlocks.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: "Match reasons: ", bold: true, size: 18 }),
            new TextRun({ text: reasons, size: 18 }),
          ],
        })
      );
    }
  }

  const doc = new Document({
    creator: "Investor Attraction Officer Desk",
    title: "Match Workbench export",
    description: "Filtered company-opportunity matches",
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({
                text: "Investor Attraction",
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: "Match Workbench export",
                size: 28,
                color: "344054",
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: `Exported ${meta.exportedAt.toLocaleString()} · ${
                  meta.exportedCount
                } of ${meta.totalAvailable} matches`,
                size: 18,
                color: "667085",
              }),
            ],
          }),
          ...meta.filterSummary.map(
            (line) =>
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({ text: line, size: 18, color: "475467" }),
                ],
              })
          ),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text: "Tier summary", bold: true })],
          }),
          ...Object.entries(byTier)
            .sort((a, b) => b[1] - a[1])
            .map(
              ([tier, n]) =>
                new Paragraph({
                  spacing: { after: 40 },
                  children: [
                    new TextRun({
                      text: `${tier}: ${n}`,
                      size: 20,
                    }),
                  ],
                })
            ),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 280, after: 120 },
            children: [
              new TextRun({
                text:
                  matches.length > 80
                    ? "Ranked shortlist (first 80)"
                    : "Ranked shortlist",
                bold: true,
              }),
            ],
          }),
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            rows: [headerRow, ...tableRows],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            children: [
              new TextRun({
                text:
                  matches.length > 40
                    ? "Evidence notes (first 40)"
                    : "Evidence notes",
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: "Use the Excel/CSV export for the full column set across all rows.",
                italics: true,
                size: 18,
                color: "667085",
              }),
            ],
          }),
          ...narrativeBlocks,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `match_workbench_${stamp()}.docx`);
  return meta;
}

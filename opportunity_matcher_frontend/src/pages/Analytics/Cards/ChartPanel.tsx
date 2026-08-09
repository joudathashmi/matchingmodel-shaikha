import React, { useRef, useState } from "react";
import styled from "styled-components";
import { FileImage, FileText, Presentation, FileType } from "lucide-react";
import {
  exportElementPdf,
  exportElementPng,
  stampFilename,
} from "../utils/analyticsExport";
import {
  exportSingleChart,
  OfficeChartSpec,
} from "../utils/officeChartExport";

type ChartPanelProps = {
  title: string;
  subtitle?: string;
  exportName: string;
  children: React.ReactNode;
  tall?: boolean;
  /** When set, Word / PowerPoint export native editable Office charts */
  officeChart?: OfficeChartSpec | null;
};

const ChartPanel: React.FC<ChartPanelProps> = ({
  title,
  subtitle,
  exportName,
  children,
  tall,
  officeChart,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"png" | "pdf" | "pptx" | "docx" | null>(
    null
  );

  const runRaster = async (kind: "png" | "pdf") => {
    if (!ref.current || busy) return;
    setBusy(kind);
    try {
      if (kind === "png") {
        await exportElementPng(ref.current, stampFilename(exportName, "png"));
      } else {
        await exportElementPdf(ref.current, stampFilename(exportName, "pdf"));
      }
    } finally {
      setBusy(null);
    }
  };

  const runOffice = async (kind: "pptx" | "docx") => {
    if (!officeChart || busy) return;
    setBusy(kind);
    try {
      await exportSingleChart(officeChart, kind, exportName);
    } catch (e) {
      console.error(e);
      window.alert(
        kind === "pptx"
          ? "Could not export PowerPoint. Check the chart has data."
          : "Could not export Word. Check the chart has data."
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel ref={ref} $tall={tall}>
      <Head>
        <div>
          <Title>{title}</Title>
          {subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
        </div>
        <Actions data-html2canvas-ignore="true">
          <ExportBtn
            type="button"
            onClick={() => runRaster("png")}
            disabled={!!busy}
            title="Export PNG image"
          >
            <FileImage size={14} />
            {busy === "png" ? "…" : "PNG"}
          </ExportBtn>
          <ExportBtn
            type="button"
            onClick={() => runRaster("pdf")}
            disabled={!!busy}
            title="Export PDF"
          >
            <FileText size={14} />
            {busy === "pdf" ? "…" : "PDF"}
          </ExportBtn>
          {officeChart ? (
            <>
              <ExportBtn
                type="button"
                onClick={() => runOffice("docx")}
                disabled={!!busy}
                title="Export editable Word chart"
              >
                <FileType size={14} />
                {busy === "docx" ? "…" : "Word"}
              </ExportBtn>
              <ExportBtn
                type="button"
                onClick={() => runOffice("pptx")}
                disabled={!!busy}
                title="Export editable PowerPoint chart"
              >
                <Presentation size={14} />
                {busy === "pptx" ? "…" : "PPT"}
              </ExportBtn>
            </>
          ) : null}
        </Actions>
      </Head>
      <PanelBody>{children}</PanelBody>
    </Panel>
  );
};

export default ChartPanel;

const Panel = styled.section<{ $tall?: boolean }>`
  background: linear-gradient(
    165deg,
    rgba(28, 37, 65, 0.95) 0%,
    rgba(18, 24, 42, 0.98) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 1rem 1.1rem 1.15rem;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: ${({ $tall }) => ($tall ? "360px" : "auto")};
`;

const Head = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: -0.01em;
`;

const Subtitle = styled.p`
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  color: rgba(203, 213, 225, 0.72);
  line-height: 1.35;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem;
  flex-shrink: 0;
  max-width: 100%;
`;

const ExportBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(232, 238, 245, 0.92);
  border-radius: 7px;
  padding: 0.28rem 0.5rem;
  font-size: 0.68rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.28);
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

const PanelBody = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

export const ChartEmpty = styled.div`
  flex: 1;
  display: grid;
  place-items: center;
  color: rgba(203, 213, 225, 0.65);
  font-size: 0.85rem;
  min-height: 180px;
`;

export const TOOLTIP_STYLE = {
  background: "rgba(12, 18, 32, 0.96)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  borderRadius: 8,
  color: "#fff",
  fontSize: 12,
};

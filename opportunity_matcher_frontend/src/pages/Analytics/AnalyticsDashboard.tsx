import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  Download,
  FileImage,
  FileText,
  FileType,
  Presentation,
  RefreshCw,
} from "lucide-react";
import AnalyticsValue from "./Cards/AnalyticsValue";
import AnalyticsRate from "./Cards/AnalyticsRate";
import SectorHeatMap from "./Cards/SectorHeatMap";
import TopMatchIntelligence from "./Cards/TopMatchIntelligence";
import MarketInsights from "./Cards/MarketInsights";
import { getAnalytics } from "../../store/actions/analyticsActions";
import {
  selectAnalyticsLoading,
  selectAnalyticsError,
  selectAnalyticsMeta,
  selectAnalyticsKpis,
  selectAnalyticsGrowthRates,
  selectAnalyticsPerformance,
  selectAnalyticsScoreDistribution,
  selectAnalyticsHeatmap,
  selectAnalyticsDecisionTiers,
} from "../../store/selectors/analyticsSelectors";
import { LoadingSpinnerWithMessage } from "../../common/LoaderSpinner&ErrorLayout/LoadingSpinnerWithMessage";
import { ErrorMessage } from "../../common/LoaderSpinner&ErrorLayout/ErrorMessage";
import {
  exportElementPdf,
  exportElementPng,
  stampFilename,
} from "./utils/analyticsExport";
import { buildAnalyticsOfficeCharts } from "./utils/buildAnalyticsOfficeCharts";
import {
  exportChartsDocx,
  exportChartsPptx,
  stampOfficeFilename,
} from "./utils/officeChartExport";

const POLL_MS = 60_000;

const AnalyticsDashboard: React.FC = () => {
  const dispatch = useDispatch<any>();
  const reportRef = useRef<HTMLDivElement>(null);
  const loading = Boolean(useSelector(selectAnalyticsLoading));
  const error = useSelector(selectAnalyticsError) as string | null;
  const meta = useSelector(selectAnalyticsMeta);
  const kpis = useSelector(selectAnalyticsKpis);
  const growthRates = useSelector(selectAnalyticsGrowthRates);
  const performance = useSelector(selectAnalyticsPerformance);
  const scoreDistribution = useSelector(selectAnalyticsScoreDistribution);
  const heatmap = useSelector(selectAnalyticsHeatmap);
  const decisionTiers = useSelector(selectAnalyticsDecisionTiers);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState<
    "png" | "pdf" | "pptx" | "docx" | null
  >(null);
  const hasData = Array.isArray(kpis) && kpis.length > 0;

  useEffect(() => {
    dispatch(getAnalytics());
    const timer = window.setInterval(() => {
      dispatch(getAnalytics());
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [dispatch]);

  useEffect(() => {
    if (!loading) setRefreshing(false);
  }, [loading]);

  const exportReport = async (kind: "png" | "pdf") => {
    if (!reportRef.current || exporting) return;
    setExporting(kind);
    try {
      if (kind === "png") {
        await exportElementPng(
          reportRef.current,
          stampFilename("analytics_portal", "png")
        );
      } else {
        await exportElementPdf(
          reportRef.current,
          stampFilename("analytics_portal", "pdf")
        );
      }
    } finally {
      setExporting(null);
    }
  };

  const exportOfficeReport = async (kind: "pptx" | "docx") => {
    if (exporting) return;
    const charts = buildAnalyticsOfficeCharts({
      kpis,
      growthRates,
      performance,
      scoreDistribution,
      heatmap,
      decisionTiers,
    });
    if (!charts.length) {
      window.alert("No chart data available to export yet.");
      return;
    }
    setExporting(kind);
    try {
      const name = stampOfficeFilename("analytics_portal", kind);
      if (kind === "pptx") await exportChartsPptx(charts, name);
      else await exportChartsDocx(charts, name);
    } catch (e) {
      console.error(e);
      window.alert(
        kind === "pptx"
          ? "PowerPoint export failed."
          : "Word export failed."
      );
    } finally {
      setExporting(null);
    }
  };

  if (loading && !hasData) {
    return (
      <LoadingSpinnerWithMessage
        message="Loading analytics..."
        translateX="100px"
      />
    );
  }

  if (error && !hasData) {
    return <ErrorMessage error={error} translateX="100px" />;
  }

  const generatedLabel = meta?.generatedAt
    ? new Date(String(meta.generatedAt)).toLocaleString()
    : "";
  const isBusy = loading || refreshing;

  return (
    <Page>
      <Hero>
        <HeroCopy>
          <Eyebrow>Analytics</Eyebrow>
          <Title>Matching performance</Title>
          <Lead>
            Pursue yield, coverage, score distribution and the facilitation
            backlog from the current matching book.
          </Lead>
        </HeroCopy>
        <HeroActions>
          <LiveBadge>
            <LiveDot />
            Current book
          </LiveBadge>
          {generatedLabel ? <MetaText>Updated {generatedLabel}</MetaText> : null}
          {typeof meta?.pursue === "number" ? (
            <MetaText>{meta.pursue.toLocaleString()} pursue pairs</MetaText>
          ) : null}
          <ActionBtn
            type="button"
            onClick={() => {
              setRefreshing(true);
              dispatch(getAnalytics());
            }}
            disabled={isBusy}
          >
            <RefreshCw size={14} />
            {isBusy ? "Refreshing…" : "Refresh"}
          </ActionBtn>
          <ActionBtn
            type="button"
            onClick={() => exportReport("png")}
            disabled={!!exporting}
          >
            <FileImage size={14} />
            {exporting === "png" ? "Exporting…" : "PNG"}
          </ActionBtn>
          <ActionBtn
            type="button"
            onClick={() => exportReport("pdf")}
            disabled={!!exporting}
          >
            <FileText size={14} />
            {exporting === "pdf" ? "Exporting…" : "PDF"}
          </ActionBtn>
          <ActionBtn
            type="button"
            onClick={() => exportOfficeReport("docx")}
            disabled={!!exporting}
            title="Editable Office charts + data tables"
          >
            <FileType size={14} />
            {exporting === "docx" ? "Exporting…" : "Word"}
          </ActionBtn>
          <ActionBtn
            type="button"
            $primary
            onClick={() => exportOfficeReport("pptx")}
            disabled={!!exporting}
            title="Native editable PowerPoint charts"
          >
            <Presentation size={14} />
            {exporting === "pptx" ? "Exporting…" : "PowerPoint"}
          </ActionBtn>
        </HeroActions>
      </Hero>

      <Report ref={reportRef}>
        <AnalyticsValue />
        <AnalyticsRate />
        <SectorHeatMap />
        <TopMatchIntelligence />
        <MarketInsights />

        <FooterNote data-html2canvas-ignore="true">
          <Download size={13} />
          Word and PowerPoint exports use native Office charts — open the file,
          select a chart, then Chart Design → Edit Data. PNG/PDF remain image
          snapshots.
        </FooterNote>
      </Report>
    </Page>
  );
};

export default AnalyticsDashboard;

const Page = styled.div`
  padding: 0.35rem 0.15rem 1.5rem;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
`;

const Hero = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.15rem;
  padding: 1.15rem 1.25rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    radial-gradient(
      120% 140% at 0% 0%,
      rgba(0, 255, 136, 0.12) 0%,
      transparent 55%
    ),
    radial-gradient(
      100% 120% at 100% 0%,
      rgba(0, 180, 216, 0.12) 0%,
      transparent 50%
    ),
    linear-gradient(165deg, rgba(28, 37, 65, 0.95), rgba(14, 18, 32, 0.98));
`;

const HeroCopy = styled.div`
  min-width: min(100%, 28rem);
  max-width: 40rem;
`;

const Eyebrow = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(0, 255, 136, 0.9);
  margin-bottom: 0.35rem;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.55rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  line-height: 1.2;
`;

const Lead = styled.p`
  margin: 0.45rem 0 0;
  font-size: 0.875rem;
  color: rgba(203, 213, 225, 0.78);
  line-height: 1.45;
`;

const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const LiveBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #00ff88;
  border: 1px solid rgba(0, 255, 136, 0.4);
  background: rgba(0, 255, 136, 0.08);
  border-radius: 999px;
  padding: 0.28rem 0.65rem;
`;

const LiveDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #00ff88;
  box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.45);
  animation: pulse 1.6s ease-out infinite;

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.5);
    }
    70% {
      box-shadow: 0 0 0 8px rgba(0, 255, 136, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(0, 255, 136, 0);
    }
  }
`;

const MetaText = styled.span`
  font-size: 0.74rem;
  color: rgba(203, 213, 225, 0.8);
`;

const ActionBtn = styled.button<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 8px;
  padding: 0.42rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid
    ${({ $primary }) =>
      $primary ? "rgba(0, 255, 136, 0.55)" : "rgba(255, 255, 255, 0.14)"};
  background: ${({ $primary }) =>
    $primary ? "rgba(0, 255, 136, 0.16)" : "rgba(255, 255, 255, 0.04)"};
  color: ${({ $primary }) => ($primary ? "#00ff88" : "#e2e8f0")};

  &:hover:not(:disabled) {
    background: ${({ $primary }) =>
      $primary ? "rgba(0, 255, 136, 0.24)" : "rgba(255, 255, 255, 0.08)"};
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

const Report = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  background: transparent;
`;

const FooterNote = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.75rem 0.2rem 0;
  font-size: 0.75rem;
  color: rgba(203, 213, 225, 0.55);
`;

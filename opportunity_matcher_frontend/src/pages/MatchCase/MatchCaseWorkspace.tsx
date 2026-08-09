import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import AppShell from "../../components/AppShell";
import { getMatchById } from "../../store/services/getMatchByIdService";
import { ActiveMatch } from "../../store/types/filterMatchesTypes";
import { EvidenceStrip, MatchSignalChips } from "../../common/AiSignalChips";
import { scorePercent } from "../../common/aiMatchUtils";
import {
  PURSUIT_STAGES,
  normalizePursuitStatus,
  isActivePursuit,
} from "../../common/pursuitStages";
import { createMatchAgreementRequest } from "../../store/actions/CreateMatchAgreementActions";
import { AppDispatch } from "../../store";
import { LoadingSpinnerWithMessage } from "../../common/LoaderSpinner&ErrorLayout/LoadingSpinnerWithMessage";
import { ErrorMessage } from "../../common/LoaderSpinner&ErrorLayout/ErrorMessage";
import EngagementPlanPopup from "../ActiveMatches/Cards/EngagementPlanPopup ";
import { toastSuccess } from "../../common/toast";
import { pushRecentDesk } from "../../common/recentDesk";

const MatchCaseWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [match, setMatch] = useState<ActiveMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getMatchById(Number(id));
        if (!cancelled) {
          setMatch(data);
          pushRecentDesk({
            kind: "match",
            matchId: data.id,
            companyName: data.companyName,
            opportunityName: data.opportunityName,
            subtitle: data.decisionTier || undefined,
          });
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load match case");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const setStage = (status: string, message?: string) => {
    if (!match) return;
    dispatch(
      createMatchAgreementRequest({
        matchId: match.id,
        status: status as any,
      })
    );
    setMatch({ ...match, userAgreement: status });
    if (message) toastSuccess(message);
  };

  const reasons = Array.isArray(match?.matchReason)
    ? (match?.matchReason as string[])
    : typeof match?.matchReason === "string" && match.matchReason
      ? [match.matchReason]
      : [];
  const explanations = Array.isArray(match?.aiExplanation)
    ? match!.aiExplanation
    : [];
  const stage = normalizePursuitStatus(match?.userAgreement);
  const stageLabel =
    stage === "PlanShared"
      ? "Plan shared"
      : stage === "Rejected"
        ? "Not a fit"
        : stage;

  return (
    <AppShell subLabel="Match Case">
        <BackRow>
          <BackBtn onClick={() => navigate("/match-workbench")}>← Match Workbench</BackBtn>
          <BackBtn onClick={() => navigate("/pursuit")}>Pursuit Pipeline →</BackBtn>
        </BackRow>

        {loading && <LoadingSpinnerWithMessage message="Loading match case..." translateX="0" />}
        {error && <ErrorMessage error={error} translateX="0" />}

        {match && !loading && (
          <>
            <CaseHeader>
              <div>
                <Eyebrow>Match case · company × opportunity</Eyebrow>
                <Title>{match.companyName}</Title>
                <SubTitle>{match.opportunityName}</SubTitle>
                <Meta>
                  {match.companySector} · {match.opportunitySector}
                </Meta>
                <MatchSignalChips
                  decisionTier={match.decisionTier}
                  confidenceScore={match.confidenceScore}
                  confidenceLabel={match.confidenceLabel}
                  evidenceFlag={match.evidenceFlag}
                  valueChainPosition={match.valueChainPosition}
                  modelVersion={match.modelVersion}
                  finalScore={match.finalScore}
                />
              </div>
              <ScoreBlock>
                <BigScore>{scorePercent(match.finalScore)}%</BigScore>
                <ScoreLabel>Overall match</ScoreLabel>
                <PrimaryBtn onClick={() => setPlanOpen(true)}>Suggest engagement plan</PrimaryBtn>
              </ScoreBlock>
            </CaseHeader>

            <EvidenceStrip strengths={match.strengths} risks={match.risks} maxLen={320} />

            <Section>
              <SectionTitle>Match reasons</SectionTitle>
              {reasons.length === 0 && <Empty>No structured reasons available.</Empty>}
              {reasons.map((r, i) => (
                <Reason key={i}>{r}</Reason>
              ))}
            </Section>

            <Section>
              <SectionTitle>Evidence depth</SectionTitle>
              <DepthGrid>
                {[
                  { title: "Profile & product", body: explanations[0] },
                  { title: "Strategic alignment", body: explanations[1] },
                  { title: "Value proposition", body: explanations[2] },
                ].map((b) => (
                  <DepthCard key={b.title}>
                    <DepthTitle>{b.title}</DepthTitle>
                    <DepthBody>{b.body || "-"}</DepthBody>
                  </DepthCard>
                ))}
              </DepthGrid>
              {match.recommendedEngagement && (
                <DepthCard style={{ marginTop: "0.75rem" }}>
                  <DepthTitle>Recommended engagement</DepthTitle>
                  <DepthBody>{match.recommendedEngagement}</DepthBody>
                </DepthCard>
              )}
              {match.localizationModel && (
                <DepthCard style={{ marginTop: "0.75rem" }}>
                  <DepthTitle>Localization model</DepthTitle>
                  <DepthBody>{match.localizationModel}</DepthBody>
                </DepthCard>
              )}
            </Section>

            <Section>
              <SectionTitle>Pursuit</SectionTitle>
              {!isActivePursuit(stage) && stage !== "Rejected" ? (
                <>
                  <StageHint>
                    Put this match on your pipeline. You can change the stage
                    anytime in Pursuit.
                  </StageHint>
                  <StageRow>
                    <PrimaryBtn
                      type="button"
                      onClick={() =>
                        setStage(
                          "Engage",
                          "Added to Pursuit. Open Pursuit Pipeline to track it."
                        )
                      }
                    >
                      Start pursuit
                    </PrimaryBtn>
                    <StageBtn
                      $tone="reject"
                      onClick={() => setStage("Rejected", "Marked as not a fit.")}
                    >
                      Not a fit
                    </StageBtn>
                  </StageRow>
                </>
              ) : (
                <>
                  <StageHint>
                    {stage === "Rejected"
                      ? "This match is marked not a fit. Start pursuit to put it on the pipeline."
                      : `On your pipeline · ${stageLabel}. Move the stage below, or open Pursuit.`}
                  </StageHint>
                  {isActivePursuit(stage) && (
                    <StageRow>
                      <PrimaryBtn type="button" onClick={() => navigate("/pursuit")}>
                        Open Pursuit
                      </PrimaryBtn>
                    </StageRow>
                  )}
                  <StageHint style={{ marginTop: "0.85rem" }}>
                    Change stage
                  </StageHint>
                  <StageRow>
                    {PURSUIT_STAGES.map((s) => (
                      <StageBtn
                        key={s.id}
                        $active={stage === s.id}
                        onClick={() => setStage(s.id)}
                        title={s.description}
                      >
                        {s.label}
                      </StageBtn>
                    ))}
                    <StageBtn
                      $active={stage === "Hold"}
                      $tone="hold"
                      onClick={() => setStage("Hold")}
                    >
                      Hold
                    </StageBtn>
                    <StageBtn
                      $active={stage === "Rejected"}
                      $tone="reject"
                      onClick={() => setStage("Rejected")}
                    >
                      Not a fit
                    </StageBtn>
                  </StageRow>
                </>
              )}
            </Section>
          </>
        )}

        {planOpen && match && (
          <EngagementPlanPopup
            isOpen={planOpen}
            onClose={() => setPlanOpen(false)}
            match={
              Array.isArray(match.suggestedPlan)
                ? match.suggestedPlan
                : match.suggestedPlan
                  ? [String(match.suggestedPlan)]
                  : []
            }
          />
        )}
    </AppShell>
  );
};

export default MatchCaseWorkspace;

const BackRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
`;
const BackBtn = styled.button`
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  font-size: 0.85rem;
  &:hover {
    color: #ace7ff;
  }
`;
const CaseHeader = styled.div`
  display: grid;
  grid-template-columns: 1.6fr 0.7fr;
  gap: 1.5rem;
  margin-bottom: 1rem;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;
const Eyebrow = styled.div`
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 0.35rem;
`;
const Title = styled.h1`
  margin: 0;
  font-size: 1.65rem;
  color: #9ef0c8;
  letter-spacing: -0.02em;
`;
const SubTitle = styled.h2`
  margin: 0.35rem 0 0;
  font-size: 1.15rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
`;
const Meta = styled.div`
  margin-top: 0.4rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.88rem;
`;
const ScoreBlock = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 1.1rem;
  background: rgba(255, 255, 255, 0.03);
  text-align: center;
`;
const BigScore = styled.div`
  font-size: 2.4rem;
  font-weight: 700;
  color: #9ef0c8;
`;
const ScoreLabel = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 0.85rem;
`;
const PrimaryBtn = styled.button`
  width: 100%;
  border: none;
  border-radius: 8px;
  padding: 0.7rem 1rem;
  background: #00c88c;
  color: #0a0a0a;
  font-weight: 650;
  cursor: pointer;
`;
const Section = styled.section`
  margin-top: 1.5rem;
`;
const SectionTitle = styled.h3`
  margin: 0 0 0.65rem;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.88);
`;
const Reason = styled.p`
  margin: 0 0 0.55rem;
  padding: 0.65rem 0.8rem;
  border-left: 2px solid rgba(158, 240, 200, 0.5);
  background: rgba(255, 255, 255, 0.03);
  font-size: 0.88rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.8);
`;
const Empty = styled.p`
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.88rem;
`;
const DepthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;
const DepthCard = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0.85rem;
  background: rgba(255, 255, 255, 0.03);
`;
const DepthTitle = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 0.4rem;
`;
const DepthBody = styled.p`
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.78);
`;
const StageHint = styled.p`
  margin: 0 0 0.75rem;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.45);
`;
const StageRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;
const StageBtn = styled.button<{ $active?: boolean; $tone?: "hold" | "reject" }>`
  border-radius: 6px;
  padding: 0.55rem 0.85rem;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  border: 1px solid
    ${(p) =>
      p.$active
        ? p.$tone === "reject"
          ? "rgba(255,120,100,0.6)"
          : p.$tone === "hold"
            ? "rgba(230,190,80,0.55)"
            : "rgba(0,200,140,0.55)"
        : "rgba(255,255,255,0.14)"};
  background: ${(p) =>
    p.$active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"};
  color: ${(p) =>
    p.$tone === "reject"
      ? "#ffb4a8"
      : p.$tone === "hold"
        ? "#f0d78a"
        : "rgba(255,255,255,0.88)"};
`;

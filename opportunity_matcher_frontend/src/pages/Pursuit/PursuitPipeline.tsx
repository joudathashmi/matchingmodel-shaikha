import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import AppShell from "../../components/AppShell";
import { MatchAgreement } from "../../store/types/getMatchAgreementsTypes";
import { getMatchAgreementsService } from "../../store/services/getMatchAgreementsService";
import { createMatchAgreementRequest } from "../../store/actions/CreateMatchAgreementActions";
import { AppDispatch } from "../../store";
import {
  PURSUIT_STAGES,
  normalizePursuitStatus,
  PursuitStageId,
} from "../../common/pursuitStages";
import { LoadingSpinnerWithMessage } from "../../common/LoaderSpinner&ErrorLayout/LoadingSpinnerWithMessage";
import { ErrorMessage } from "../../common/LoaderSpinner&ErrorLayout/ErrorMessage";
import { selectCanViewTeamPursuits } from "../../store/selectors/getUserRoleSelectors";
import typography from "../../common/typography";
import PursuitNotes, { MatchComment } from "./PursuitNotes";
import axiosClient from "../../api/axiosClient";

const PursuitPipeline: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const canViewTeam = useSelector(selectCanViewTeamPursuits);
  const [agreements, setAgreements] = useState<MatchAgreement[]>([]);
  const [commentsByMatch, setCommentsByMatch] = useState<
    Record<number, MatchComment[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComments = async (matchIds: number[]) => {
    const unique = Array.from(new Set(matchIds.filter((id) => id > 0)));
    if (!unique.length) {
      setCommentsByMatch({});
      return;
    }
    try {
      const { data } = await axiosClient.get("/match-comments", {
        params: { matchIds: unique.join(",") },
      });
      const list = (data.comments || []) as MatchComment[];
      const map: Record<number, MatchComment[]> = {};
      for (const id of unique) map[id] = [];
      for (const c of list) {
        if (!map[c.matchId]) map[c.matchId] = [];
        map[c.matchId].push(c);
      }
      setCommentsByMatch(map);
    } catch {
      // Notes are secondary - don't block the board
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMatchAgreementsService.getMatchAgreements(
        canViewTeam ? { scope: "all" } : undefined
      );
      const list = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.data)
          ? (response as any).data
          : [];
      setAgreements(list);
      await loadComments(list.map((a: MatchAgreement) => a.match.id));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load pursuits");
    } finally {
      setLoading(false);
    }
  };

  const handleCommentsChange = (matchId: number, next: MatchComment[]) => {
    setCommentsByMatch((prev) => ({ ...prev, [matchId]: next }));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewTeam]);

  const columns = useMemo(() => {
    const map: Record<string, MatchAgreement[]> = {
      Engage: [],
      PlanShared: [],
      MoU: [],
      Landed: [],
      Hold: [],
    };
    for (const a of agreements) {
      const stage = normalizePursuitStatus(a.status);
      if (!stage || stage === "Rejected") continue;
      if (map[stage]) map[stage].push(a);
      else map.Engage.push(a);
    }
    return map;
  }, [agreements]);

  const moveTo = async (matchId: number, stage: string) => {
    dispatch(createMatchAgreementRequest({ matchId, status: stage as any }));
    // optimistic local move
    setAgreements((prev) =>
      prev.map((a) => (a.match.id === matchId ? { ...a, status: stage } : a))
    );
    setTimeout(load, 500);
  };

  return (
    <AppShell subLabel="Pursuit Pipeline">
        <Intro>
          <Heading>Pursuit</Heading>
          <Sub>
            Move matched pairs through Engage → Plan shared → MoU → Landed.
            Start from Matches or a Match Case.
            {canViewTeam
              ? " Showing the full team pipeline."
              : " Showing your pursuits only."}
          </Sub>
        </Intro>

        {loading && <LoadingSpinnerWithMessage message="Loading pursuits..." translateX="0" />}
        {error && <ErrorMessage error={error} translateX="0" />}

        {!loading &&
          !error &&
          Object.values(columns).every((list) => !list || list.length === 0) && (
            <BoardEmpty>
              <BoardEmptyTitle>No pursuits yet</BoardEmptyTitle>
              <BoardEmptyText>
                In Matches, open a card and click Start pursuit. It will show up
                here so you can move it through the stages.
              </BoardEmptyText>
            </BoardEmpty>
          )}

        {!loading && (
          <Board>
            {PURSUIT_STAGES.map((stage) => (
              <Column key={stage.id}>
                <ColHead>
                  <ColTitle>{stage.label}</ColTitle>
                  <Count>{columns[stage.id]?.length || 0}</Count>
                </ColHead>
                <ColDesc>{stage.description}</ColDesc>
                <Cards>
                  {(columns[stage.id] || []).map((a) => (
                    <Card key={a.id}>
                      <CardCompany
                        onClick={() => navigate(`/matches/${a.match.id}`)}
                      >
                        {a.match.company_name}
                      </CardCompany>
                      <CardOpp>{a.match.opportunity_name}</CardOpp>
                      <CardMeta>
                        {a.match.company_sector} · {a.match.opportunity_sector}
                      </CardMeta>
                      <MoveRow>
                        {PURSUIT_STAGES.filter((s) => s.id !== stage.id).map((s) => (
                          <MoveBtn
                            key={s.id}
                            onClick={() => moveTo(a.match.id, s.id as PursuitStageId)}
                          >
                            → {s.label}
                          </MoveBtn>
                        ))}
                        <MoveBtn onClick={() => moveTo(a.match.id, "Hold")}>Hold</MoveBtn>
                      </MoveRow>
                      <PursuitNotes
                        matchId={a.match.id}
                        comments={commentsByMatch[a.match.id] || []}
                        onCommentsChange={handleCommentsChange}
                      />
                    </Card>
                  ))}
                  {(columns[stage.id] || []).length === 0 && (
                    <EmptyCol>No deals in this stage</EmptyCol>
                  )}
                </Cards>
              </Column>
            ))}

            <Column>
              <ColHead>
                <ColTitle>Hold</ColTitle>
                <Count>{columns.Hold?.length || 0}</Count>
              </ColHead>
              <ColDesc>Parked for later - not rejected</ColDesc>
              <Cards>
                {(columns.Hold || []).map((a) => (
                  <Card key={a.id}>
                    <CardCompany onClick={() => navigate(`/matches/${a.match.id}`)}>
                      {a.match.company_name}
                    </CardCompany>
                    <CardOpp>{a.match.opportunity_name}</CardOpp>
                    <MoveRow>
                      <MoveBtn onClick={() => moveTo(a.match.id, "Engage")}>→ Engage</MoveBtn>
                    </MoveRow>
                    <PursuitNotes
                      matchId={a.match.id}
                      comments={commentsByMatch[a.match.id] || []}
                      onCommentsChange={handleCommentsChange}
                    />
                  </Card>
                ))}
                {(columns.Hold || []).length === 0 && <EmptyCol>Nothing on hold</EmptyCol>}
              </Cards>
            </Column>
          </Board>
        )}
    </AppShell>
  );
};

export default PursuitPipeline;

const Intro = styled.div`
  margin-bottom: 1.25rem;
`;
const Heading = styled.h1`
  margin: 0 0 0.4rem 0;
  font-size: ${typography.pageTitle.fontSize};
  font-weight: ${typography.pageTitle.fontWeight};
  color: #ffffff;
  letter-spacing: -0.01em;
  line-height: 1.2;
`;
const Sub = styled.p`
  margin: 0;
  max-width: 40rem;
  font-size: ${typography.paragraph.fontSize};
  font-weight: ${typography.paragraph.fontWeight};
  color: rgba(255, 255, 255, 0.62);
  line-height: 1.45;
`;
const BoardEmpty = styled.div`
  max-width: 28rem;
  margin: 0 0 1.5rem;
  padding: 1.25rem 1.35rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
`;
const BoardEmptyTitle = styled.h2`
  margin: 0 0 0.35rem;
  font-size: ${typography.smallTitle.fontSize};
  font-weight: ${typography.smallTitle.fontWeight};
  color: #fff;
`;
const BoardEmptyText = styled.p`
  margin: 0;
  font-size: ${typography.paragraph.fontSize};
  font-weight: ${typography.paragraph.fontWeight};
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.45;
`;
const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(220px, 1fr));
  gap: 0.85rem;
  align-items: start;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  min-width: 0;
  overflow-x: auto;
`;
const Column = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.75rem;
  min-height: 320px;
`;
const ColHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const ColTitle = styled.h3`
  margin: 0;
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.9);
`;
const Count = styled.span`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
`;
const ColDesc = styled.p`
  margin: 0.35rem 0 0.75rem;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.4);
`;
const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;
const Card = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.65rem;
  background: rgba(0, 0, 0, 0.25);
`;
const CardCompany = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  color: #9ef0c8;
  font-weight: 650;
  font-size: 0.88rem;
  cursor: pointer;
  padding: 0;
`;
const CardOpp = styled.div`
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
`;
const CardMeta = styled.div`
  margin-top: 0.25rem;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
`;
const MoveRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.55rem;
`;
const MoveBtn = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 4px;
  font-size: 0.65rem;
  padding: 0.2rem 0.4rem;
  cursor: pointer;
  &:hover {
    border-color: rgba(158, 240, 200, 0.4);
    color: #9ef0c8;
  }
`;
const EmptyCol = styled.div`
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.35);
  padding: 0.5rem 0;
`;

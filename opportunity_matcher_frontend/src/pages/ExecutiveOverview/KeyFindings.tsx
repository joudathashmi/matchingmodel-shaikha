import React from "react";
import styled from "styled-components";
import { KeyFinding } from "../../store/types/getExecutiveOverviewAiTypes";

interface KeyFindingsProps {
  keyFindings: KeyFinding[];
  engine?: string;
}

const KeyFindings: React.FC<KeyFindingsProps> = ({ keyFindings }) => {
  const findings = keyFindings || [];

  if (!findings.length) return null;

  const [lead, ...rest] = findings;

  return (
    <Panel>
      <Header>
        <SectionTitle>Findings</SectionTitle>
      </Header>

      <LeadNote>
        <LeadTitle>{lead.title}</LeadTitle>
        <LeadBody>{lead.detail}</LeadBody>
      </LeadNote>

      {rest.length > 0 && (
        <NotesGrid>
          {rest.map((finding, index) => (
            <NoteTile key={`${finding.title}-${index}`}>
              <NoteLabel>{finding.title}</NoteLabel>
              <NoteBody>{finding.detail}</NoteBody>
            </NoteTile>
          ))}
        </NotesGrid>
      )}
    </Panel>
  );
};

export default KeyFindings;

const Panel = styled.section`
  margin-top: 0;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  padding: 1.25rem 1.35rem 1.35rem;
`;

const Header = styled.div`
  margin-bottom: 0.9rem;
  padding-bottom: 0.7rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.9);
`;

const LeadNote = styled.article`
  padding: 1rem 1.05rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
  margin-bottom: 0.75rem;
`;

const LeadTitle = styled.h4`
  margin: 0 0 0.45rem;
  font-size: 1rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
`;

const LeadBody = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.82);
`;

const NotesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const NoteTile = styled.article`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.95rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
`;

const NoteLabel = styled.div`
  color: rgba(255, 255, 255, 0.88);
  font-weight: 650;
  font-size: 0.84rem;
`;

const NoteBody = styled.p`
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
`;

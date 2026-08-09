import styled from 'styled-components';

const MatchDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (min-width: 1920px) {
    gap: 1.75rem;
    margin-bottom: 2.5rem;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
  
  @media (min-width: 2560px) {
    gap: 2rem;
    margin-bottom: 3rem;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
  
  @media (min-width: 3840px) {
    gap: 2.5rem;
    margin-bottom: 3.5rem;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }
`;

const DetailSection = styled.div`
  background: rgba(255, 255, 255, 0.03);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (min-width: 1920px) {
    padding: 1.75rem;
    border-radius: 14px;
  }
  
  @media (min-width: 2560px) {
    padding: 2rem;
    border-radius: 16px;
  }
  
  @media (min-width: 3840px) {
    padding: 2.5rem;
    border-radius: 18px;
  }
`;

const DetailTitle = styled.div`
  font-weight: 600;
  margin-bottom: 1rem;
  color: #00ff88;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  @media (min-width: 1920px) {
    margin-bottom: 1.25rem;
    font-size: 1rem;
    letter-spacing: 0.6px;
  }
  
  @media (min-width: 2560px) {
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    letter-spacing: 0.7px;
  }
  
  @media (min-width: 3840px) {
    margin-bottom: 1.75rem;
    font-size: 1.3rem;
    letter-spacing: 0.8px;
  }
`;

const DetailContent = styled.div`
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
  
  @media (min-width: 1920px) {
    line-height: 1.6;
    font-size: 1.05rem;
  }
  
  @media (min-width: 2560px) {
    line-height: 1.7;
    font-size: 1.4rem;
  }
  
  @media (min-width: 3840px) {
    line-height: 1.8;
    font-size: 1.3rem;
  }
`;
const RenewableEnergyCard: React.FC = () => {
  return (
    <MatchDetails>
      <DetailSection>
        <DetailTitle>Project Scope</DetailTitle>
        <DetailContent>
          <strong>Investment:</strong> $100M - $1B<br />
          <strong>Timeline:</strong> 3-5 years<br />
          <strong>Coverage:</strong> National Grid<br />
          <strong>Technology:</strong> Advanced Analytics
        </DetailContent>
      </DetailSection>

      <DetailSection>
        <DetailTitle>Match Breakdown</DetailTitle>
        <DetailContent>
          <strong>Technical Alignment:</strong> 95%<br />
          <strong>Financial Fit:</strong> 88%<br />
          <strong>Experience Match:</strong> 90%<br />
          <strong>Risk Assessment:</strong> Moderate
        </DetailContent>
      </DetailSection>

    </MatchDetails>
  )
}
export default RenewableEnergyCard;
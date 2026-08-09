import React from "react";
import styled from "styled-components";

const InvestmentSectors: React.FC = () => {
  const data = [
    { label: "Top Sector", value: "Healthcare" },
    { label: "Best ROI", value: "ICT Sector" },
    { label: "Innovation Leader", value: "Digital Health" },
    { label: "Vision 2030 Alignment", value: "89%" },
  ];

  return (
    <Wrapper>
      {/* {data.map((item, idx) => (
        <Card key={idx}>
          <Label>{item.label}</Label>
          <Value>{item.value}</Value>
        </Card>
      ))} */}
    </Wrapper>
  );
};

export default InvestmentSectors;

// ================= styled-components =================
const Wrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin: 1rem 0;

  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin: 1.5rem 0;
  }
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 1rem;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transition: background 0.3s ease;
  }

  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    padding: 1.5rem;
    border-radius: 12px;
  }
`;

const Label = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.4rem;

  /* 4K Responsiveness */
  @media (min-width: 1921px) {
    margin-bottom: 0.7rem;
  }
`;

const Value = styled.div`
  font-size: 1.4rem;
  font-weight: 600;
  color: #fff;

  /* 4K Responsiveness */
  @media (min-width: 1921px) {
  }
`;
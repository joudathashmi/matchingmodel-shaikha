import styled from "styled-components";
import typography from "../../common/typography";

export const InsightCard = styled.div`
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  padding: 1.25rem 1.35rem 1.35rem;
  z-index: 1;
`;

  export const PanelTitle = styled.h3`
  font-size: ${typography.pageSubTitle.fontSize};
  font-weight: ${typography.pageSubTitle.fontWeight};
  
`;
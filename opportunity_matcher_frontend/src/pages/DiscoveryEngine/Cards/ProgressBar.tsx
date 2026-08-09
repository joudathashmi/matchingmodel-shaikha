import React from "react";
import {
  MatchBreakdown,
  BreakdownTitle,
  BreakdownItem,
  BreakdownLabel,
  BreakdownScore,
  LoaderBar,
  ProgressFill
} from "./DiscoveryCardCommonStyle";
import titleIcon from '../../../assets/icons/target-02.svg'
import styled from "styled-components";

interface ProgressItem {
  label: string;
  score: number;
}

interface ProgressBarProps {
  data: ProgressItem[];
}
const ProgressList = styled.div`
  flex: 1;           
  display: flex;
  flex-direction: column;
  justify-content: flex-start;  
`;

const ProgressBar: React.FC<ProgressBarProps> = ({ data }) => {
  return (
    <MatchBreakdown>
      <BreakdownTitle>
        <span><img src={titleIcon} alt="" /></span>
        Match Analysis
      </BreakdownTitle>

      <ProgressList>
        {data.map((item, idx) => (
          <React.Fragment key={idx}>
            <BreakdownItem>
              <BreakdownLabel>{item.label}</BreakdownLabel>
              <BreakdownScore>{item.score}%</BreakdownScore>
            </BreakdownItem>
            <LoaderBar>
              <ProgressFill width={item.score} />
            </LoaderBar>
          </React.Fragment>
        ))}
      </ProgressList>
    </MatchBreakdown>
  );
};


export default ProgressBar;

// import { useState } from "react";
// import styled, { css } from "styled-components";
// import sectorIcon from '../../../assets/Company-profile-icons/presentation-bar-chart-02.svg'
// import regionalIcon from '../../../assets/Company-profile-icons/globe-02.svg'
// import revenueIcon from '../../../assets/Company-profile-icons/money-bag-02.svg'
// import GrowthIcon from '../../../assets/Company-profile-icons/building-06.svg'


// const AnalyticsSection = styled.div`
//   background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.03) 100%);
//   backdrop-filter: blur(10px);
//   border-radius: 20px;
//   padding: 2rem;
//   margin-top: 3rem;
//   width: 100%;

//   box-shadow: 0 8px 24px rgba(0, 255, 136, 0.05);
//   box-sizing: border-box;

//   @media (max-width: 500px) {
//     padding: 1rem; /* reduce padding on small screens */
//     width: 100%;
//   }
// `;

// const AnalyticsHeader = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: 2rem;
// `;

// const AnalyticsTitle = styled.h2`
//   font-size: 1.6rem;
//   font-weight: 700;
//   color: white;

// `;

// const AnalyticsFilters = styled.div`
//   display: flex;
//   gap: 1rem;
// `;

// const AnalyticsBtn = styled.button<{ $active?: boolean }>`
//   background: rgba(255, 255, 255, 0.03);
//   border: 1px solid rgba(0, 255, 136, 0.3);
//   border-radius: 8px;
//   color: rgba(255, 255, 255, 0.85);
//   padding: 0.5rem 1.2rem;
//   font-size: 0.85rem;
//   font-weight: 500;
//   cursor: pointer;
//   transition: all 0.25s ease;

//   ${({ $active }) =>
//     $active &&
//     css`
//       background: rgba(0, 255, 136, 0.15);
//       border-color: #00ff88;
//       color: #00ff88;
//       box-shadow: 0 0 8px rgba(0, 255, 136, 0.3);
//     `}

//   &:hover {
//     background: rgba(0, 255, 136, 0.1);
//     border-color: #00ff88;
//     color: #00ff88;
//     box-shadow: 0 0 6px rgba(0, 255, 136, 0.25);
//   }
// `;

// const AnalyticsGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); /* smaller min for mobile */
//   gap: 1rem;

//   @media (max-width: 500px) {
//     grid-template-columns: 1fr; /* force single column on very small screens */

//   }
// `;

// const ChartContainer = styled.div`
//   background: rgba(255, 255, 255, 0.03);
//   border: 1px solid rgba(255, 255, 255, 0.08);
//   border-radius: 16px;
//   padding: 1rem;
//   height: 300px;
//   display: flex;
//   flex-direction: column;
//   transition: transform 0.25s ease, box-shadow 0.25s ease;

//   &:hover {
//       background: rgba(255, 255, 255, 0.05); /* slightly brighter */
//   border-color: rgba(255, 255, 255, 0.2); /* bit more visible */
//   box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25); /* deeper shadow */
//   transform: translateY(-4px); /* little lift */
//   }
// `;

// const ChartTitle = styled.h3`
//   font-size: 1rem;
//   font-weight: 600;
//   color: rgba(255, 255, 255, 0.9);
//   margin-bottom: 1rem;
// `;

// const ChartPlaceholder = styled.div`
//   flex: 1;


//   border-radius: 12px;

//   display: flex;
//   align-items: center;
//   justify-content: flex-start;
//   padding: ;
// `;

// const ContentWrapper = styled.div`
//   display: flex;
//   align-items: flex-start;
//   gap: 8px;
//   max-width: 85%;
//   font-size: 0.9rem;
//   color: rgba(255, 255, 255, 0.85);
//   line-height: 1.4;
// `;

// const Icon = styled.img`
//   height: 18px;
//   width: 18px;
//   flex-shrink: 0;
//   margin-top: 2px;
//   filter: drop-shadow(0 0 3px rgba(0, 255, 136, 0.3));
// `;

// type ChartItem = {
//   title: string;
//   description: string;
//   icon: string; // or React.ReactNode if you're using SVGR
// };
// const chartData = [
//   {
//     title: "Sector Distribution",
//     description:
//       "Sector analysis showing ICT leads with 526 companies, followed by Industrial & Logistics (389) and Healthcare (341)",
//     icon: sectorIcon
//   },
//   {
//     title: "Regional Insights",
//     description:
//       "57% of companies have MENA presence, with UAE and Saudi Arabia as top destinations",
//     icon: regionalIcon

//   },
//   {
//     title: "Revenue Breakdown",
//     description:
//       "23% are mega-corps ($100B+), 31% large corps ($10B-$100B), significant growth opportunity in mid-tier",
//     icon: revenueIcon
//   },
//   {
//     title: "Growth Trends",
//     description:
//       "234 Regional HQ entities, with Dubai (67%) and Riyadh (23%) as primary hubs",
//     icon: GrowthIcon
//   }
// ];

// const MarketIntelligenceCard: React.FC = () => {
//   const [active, setActive] = useState("sector");
//   return (
//     <AnalyticsSection>
//       <AnalyticsHeader>
//         <AnalyticsTitle>Market Intelligence Dashboard</AnalyticsTitle>

//         <AnalyticsFilters>
//           <AnalyticsBtn
//             $active={active === "sector"}
//             onClick={() => setActive("sector")}
//           >
//             By Sector
//           </AnalyticsBtn>

//           <AnalyticsBtn
//             $active={active === "region"}
//             onClick={() => setActive("region")}
//           >
//             By Region
//           </AnalyticsBtn>

//           <AnalyticsBtn
//             $active={active === "revenue"}
//             onClick={() => setActive("revenue")}
//           >
//             By Revenue
//           </AnalyticsBtn>

//           <AnalyticsBtn
//             $active={active === "growth"}
//             onClick={() => setActive("growth")}
//           >
//             Growth Trends
//           </AnalyticsBtn>
//         </AnalyticsFilters>
//       </AnalyticsHeader>

//       {/* Analytics-Grid */}
//       <AnalyticsGrid>
//         {chartData.map((chart, index) => (
//           <ChartContainer key={index}>
//             <ChartTitle>{chart.title}</ChartTitle>
//             <ChartPlaceholder>
//               <ContentWrapper>
//                 <Icon src={chart.icon} />
//                 <span>{chart.description}</span>
//               </ContentWrapper>
//             </ChartPlaceholder>
//           </ChartContainer>
//         ))}
//       </AnalyticsGrid>
//     </AnalyticsSection>
//   )
// }

// export default MarketIntelligenceCard;


import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  selectMarketIntelligenceCategories,
  selectMarketIntelligenceMeta,
  selectMarketIntelligenceLoading,
  selectMarketIntelligenceError,
} from "../../../store/selectors/marketIntelligenceSelectors";
import { getMarketIntelligenceRequest } from "../../../store/actions/marketIntelligenceActions";
import { MarketIntelligenceMeta } from "../../../store/types/MarketIntelligenceTypes";
import typography from "../../../common/typography";

// ===== Styled Components =====
const BREAKPOINTS = {
  MOBILE: '768px',
  TABLET: '1024px',
  LAPTOP: '1440px',
  DESKTOP: '1920px',
  QHD: '2560px',
  UHD: '3840px'
};

const Container = styled.div`
  background: linear-gradient(
    135deg,
    rgba(0, 255, 136, 0.05) 0%,
    rgba(0, 180, 216, 0.08) 100%
  );
  color: #ffffff;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  
  margin: 1rem auto;
  border: 1px solid rgba(0, 255, 136, 0.2);
  
  @media (min-width: ${BREAKPOINTS.MOBILE}) {
    padding: 1rem 1.5rem;
    margin: 1.25rem auto;
  }
  
  @media (min-width: ${BREAKPOINTS.TABLET}) {
    padding: 1rem 2rem;
    margin: 1.5rem auto;
  }
  
  @media (min-width: ${BREAKPOINTS.DESKTOP}) {
    padding: 1.5rem 2.5rem;
  }
  
  @media (min-width: ${BREAKPOINTS.QHD}) {
    padding: 2rem 3rem;
  }
  
  @media (min-width: ${BREAKPOINTS.UHD}) {
    padding: 2.5rem 4rem;
    max-width: 1800px;
  }
`;

const Title = styled.h2`
  color: #00ff88;
  font-size: ${typography.datasHeading.fontSize};
  font-weight: ${typography.datasHeading.fontWeight};
  margin: 0 0 0.75rem 0;
  
  @media (min-width: ${BREAKPOINTS.MOBILE}) {
    margin-bottom: 0.85rem;
  }
  
  @media (min-width: ${BREAKPOINTS.TABLET}) {
    margin-bottom: 1rem;
  }
  
  @media (min-width: ${BREAKPOINTS.DESKTOP}) {
    margin-bottom: 1.25rem;
  }
  
  @media (min-width: ${BREAKPOINTS.UHD}) {
    margin-bottom: 1.5rem;
  }
`;

const FilterBar = styled.div`
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(2, 1fr);
  margin-bottom: 1rem;

  @media (min-width: ${BREAKPOINTS.MOBILE}) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.7rem;
    margin-bottom: 1.25rem;
  }

  @media (min-width: ${BREAKPOINTS.TABLET}) {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
    margin-bottom: 1.5rem;
  }

  @media (min-width: ${BREAKPOINTS.LAPTOP}) {
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.75rem;
  }

  @media (min-width: ${BREAKPOINTS.DESKTOP}) {
    grid-template-columns: repeat(4, 1fr);
    gap: 1.2rem;
    margin-bottom: 2rem;
  }

  @media (min-width: ${BREAKPOINTS.UHD}) {
    margin-bottom: 2.5rem;
  }
`;

const FilterButton = styled.button<{ active?: boolean }>`
  background: ${(p) => (p.active ? "rgba(0, 255, 136, 0.1)" : "transparent")};
  border: 1px solid #00ff88;
  color: ${(p) => (p.active ? "#00ff88" : "#ffffff")};
  border-radius: 6px;
  padding: 0.4rem 0.9rem;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    background: rgba(0, 255, 136, 0.2);
  }

  @media (min-width: ${BREAKPOINTS.TABLET}) {
    padding: 0.45rem 1rem;
  }

  @media (min-width: ${BREAKPOINTS.LAPTOP}) {
    padding: 0.5rem 1.1rem;
  }

  @media (min-width: ${BREAKPOINTS.DESKTOP}) {
    padding: 0.55rem 1.2rem;
    border-radius: 8px;
  }
`;

const CardsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  gap: clamp(0.875rem, 1.5vw, 1.5rem);
  width: 100%;
  min-width: 0;
`;

const Card = styled.div`
  background: #1c2541;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  position: relative;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 255, 136, 0.2);
    border-color: rgba(0, 255, 136, 0.4);
  }
  
  @media (min-width: ${BREAKPOINTS.MOBILE}) {
    border-radius: 11px;
    padding: 0.9rem;
    gap: 0.45rem;
  }
  
  @media (min-width: ${BREAKPOINTS.TABLET}) {
    border-radius: 12px;
    padding: 1rem;
    gap: 0.5rem;
  }
  
  @media (min-width: ${BREAKPOINTS.DESKTOP}) {
    padding: 1.25rem;
    gap: 0.6rem;
  }
  
  @media (min-width: ${BREAKPOINTS.UHD}) {
    border-radius: 14px;
    padding: 1.5rem;
    gap: 0.75rem;
  }
`;

const IconWrapper = styled.div`
  width: 32px;
  height: 32px;
  background: rgba(0, 255, 136, 0.08);
  border-radius: 50%;
  padding: 0.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00ff88;
  font-size: 1.1rem;
  
  @media (min-width: ${BREAKPOINTS.MOBILE}) {
    width: 34px;
    height: 34px;
    font-size: 1.15rem;
  }
  
  @media (min-width: ${BREAKPOINTS.TABLET}) {
    width: 36px;
    height: 36px;
    font-size: 1.2rem;
  }
  
  @media (min-width: ${BREAKPOINTS.DESKTOP}) {
    width: 40px;
    height: 40px;
    font-size: 1.3rem;
  }
  
  @media (min-width: ${BREAKPOINTS.UHD}) {
    width: 48px;
    height: 48px;
    font-size: 1.5rem;
  }
`;

const CardTitle = styled.h3`
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  margin: 0;
`;

const CardText = styled.p`
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
  color: #cbd5e1;
  margin: 0;

`;

const Score = styled.div`
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: ${typography.dataRoundedValue.fontSize};
  font-weight: ${typography.dataRoundedValue.fontWeight};
  color: rgb(0, 255, 136);
  
 
  @media (min-width: ${BREAKPOINTS.DESKTOP}) {
    top: 10px;
    right: 12px;
  }
  
  @media (min-width: ${BREAKPOINTS.UHD}) {
    top: 12px;
    right: 15px;
  }
`;

const Icon = styled.img`
  height: 17px;
  width: 17px;
  
  @media (min-width: ${BREAKPOINTS.MOBILE}) {
    height: 18px;
    width: 18px;
  }
  
  @media (min-width: ${BREAKPOINTS.TABLET}) {
    height: 19px;
    width: 19px;
  }
  
  @media (min-width: ${BREAKPOINTS.DESKTOP}) {
    height: 21px;
    width: 21px;
  }
  
  @media (min-width: ${BREAKPOINTS.UHD}) {
    height: 24px;
    width: 24px;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const LiveMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
`;

const LiveBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #00ff88;
  border: 1px solid rgba(0, 255, 136, 0.45);
  background: rgba(0, 255, 136, 0.08);
  border-radius: 999px;
  padding: 0.25rem 0.65rem;
`;

const LiveDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #00ff88;
  box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.55);
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
  font-size: 0.75rem;
  color: rgba(203, 213, 225, 0.9);
`;

const RefreshButton = styled.button`
  background: transparent;
  border: 1px solid rgba(0, 255, 136, 0.45);
  color: #00ff88;
  border-radius: 6px;
  padding: 0.3rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    background: rgba(0, 255, 136, 0.12);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const StatusText = styled.p`
  color: #cbd5e1;
  font-size: 0.9rem;
  margin: 0.5rem 0 0;
`;

const POLL_MS = 60_000;

const MarketIntelligence: React.FC = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectMarketIntelligenceCategories);
  const meta = useSelector(selectMarketIntelligenceMeta) as MarketIntelligenceMeta | null;
  const loading = Boolean(useSelector(selectMarketIntelligenceLoading));
  const error = useSelector(selectMarketIntelligenceError) as string | null;
  const categoryKeys = Object.keys(categories || {});
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(getMarketIntelligenceRequest());
    const timer = window.setInterval(() => {
      dispatch(getMarketIntelligenceRequest());
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [dispatch]);

  useEffect(() => {
    if (!activeFilter && categoryKeys.length > 0) {
      setActiveFilter(categoryKeys[0]);
    } else if (activeFilter && categoryKeys.length > 0 && !categories[activeFilter]) {
      setActiveFilter(categoryKeys[0]);
    }
  }, [categories, categoryKeys, activeFilter]);

  useEffect(() => {
    if (!loading) setRefreshing(false);
  }, [loading]);

  const data = (activeFilter && categories?.[activeFilter]) || [];
  const generatedAt = meta?.generatedAt ? String(meta.generatedAt) : "";
  const generatedLabel = generatedAt
    ? new Date(generatedAt).toLocaleTimeString()
    : "";
  const pursueCount =
    typeof meta?.pursue === "number" ? meta.pursue.toLocaleString() : "";
  const isBusy = loading || refreshing;

  const handleRefresh = () => {
    setRefreshing(true);
    dispatch(getMarketIntelligenceRequest());
  };

  return (
    <Container>
      <HeaderRow>
        <Title style={{ margin: 0 }}>Company market brief</Title>
        <LiveMeta>
          <LiveBadge>
            <LiveDot />
            Current book
          </LiveBadge>
          {generatedLabel ? <MetaText>Updated {generatedLabel}</MetaText> : null}
          {pursueCount ? (
            <MetaText>{pursueCount} pursue pairs</MetaText>
          ) : null}
          <RefreshButton onClick={handleRefresh} disabled={isBusy}>
            {isBusy ? "Refreshing..." : "Refresh"}
          </RefreshButton>
        </LiveMeta>
      </HeaderRow>

      <FilterBar>
        {categoryKeys.map((category) => (
          <FilterButton
            key={category}
            active={activeFilter === category}
            onClick={() => setActiveFilter(category)}
          >
            {category}
          </FilterButton>
        ))}
      </FilterBar>

      {loading && data.length === 0 ? (
        <StatusText>Loading company brief...</StatusText>
      ) : null}
      {error && data.length === 0 ? (
        <StatusText style={{ color: "#f87171" }}>{error}</StatusText>
      ) : null}

      <CardsWrapper>
        {data.map((item) => (
          <Card key={`${item.id}-${item.title}`}>
            <Score>{Math.round(item.score * 100)}%</Score>
            <CardTitle>{item.title}</CardTitle>
            <CardText>{item.description}</CardText>
          </Card>
        ))}
      </CardsWrapper>
    </Container>
  );
};

export default MarketIntelligence;
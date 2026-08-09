import React, { useCallback, useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { getCompanyStatsRequest } from '../../../store/actions/getCompanyStatsActions';
import {
  selectCompanyStats,
  selectCompanyStatsLoading,
  selectCompanyStatsError,
  selectTotalCompanies,
  selectMeenaPresence,
  selectSaudiActive,
  selectRhqEntities,
  selectAverageRevenue
} from '../../../store/selectors/getCompanyStatsSelectors';
import { useDispatch, useSelector } from "react-redux";

const CompanyDetails: React.FC = () => {
  const dispatch = useDispatch();
  const [showError, setShowError] = useState(true);

  // Select data from Redux store
  const stats = useSelector(selectCompanyStats);
  const loading = useSelector(selectCompanyStatsLoading);
  const error = useSelector(selectCompanyStatsError);

  // Alternatively, use specific selectors
  const totalCompanies = useSelector(selectTotalCompanies);
  const meenaPresence = useSelector(selectMeenaPresence);
  const saudiActive = useSelector(selectSaudiActive);
  const rhqEntities = useSelector(selectRhqEntities);
  const averageRevenue = useSelector(selectAverageRevenue);

  // Fetch data function
  const fetchStats = useCallback(() => {
    dispatch(getCompanyStatsRequest());
    setShowError(true); // Show error again if retrying
  }, [dispatch]);

  // Fetch data on component mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset error visibility when error changes
  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  if (loading) {
    return <div>Loading company statistics...</div>;
  }

  
  const formatLargeNumber = (num: number): string => {
  if (num >= 1000000000) {
    return `$${(num / 1000000000).toFixed(2)}B`; 
  } else if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`; 
  } else {
    return `$${num.toLocaleString()}`;
  }
};

// Usage in your data array
const data = [
  { 
    label: "Total Companies", 
    value: totalCompanies.toLocaleString(),
    rawValue: totalCompanies
  },
  { 
    label: "MEENA Presence", 
    value: meenaPresence.toLocaleString(),
    rawValue: meenaPresence
  },
  { 
    label: "Saudi Active", 
    value: saudiActive.toLocaleString(),
    rawValue: saudiActive
  },
  { 
    label: "RHQ Entities", 
    value: rhqEntities.toLocaleString(),
    rawValue: rhqEntities
  },
  { 
    label: "Average Revenue", 
    value: formatLargeNumber(averageRevenue),
    rawValue: formatLargeNumber(averageRevenue)
  },
];

  return (
    <>
      {error && showError && (
        <ErrorPopup>
          <ErrorContent>
            {/* <ErrorIcon>⚠️</ErrorIcon> */}
            <ErrorMessage>Error: {error}</ErrorMessage>
            <RetryButton onClick={fetchStats}>Retry</RetryButton>
            <CloseButton onClick={() => setShowError(false)}>×</CloseButton>
          </ErrorContent>
        </ErrorPopup>
      )}

      <Wrapper>
        {data.map((item, idx) => (
          <Card key={idx}>
            <Label>{item.label}</Label>
            <Value>{item.rawValue}</Value>
          </Card>
        ))}
      </Wrapper>
    </>
  );
};

export default CompanyDetails;

// ================= styled-components =================   
const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
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
`;

const Label = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.4rem;
  @media (min-width: 1921px) {
    font-size: 1.3rem;
  }
`;

const Value = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  @media (min-width: 1921px) {
    font-size: 1.7rem;
  }
`;

const ErrorPopup = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  animation: ${slideIn} 0.3s ease-out;
`;

const ErrorContent = styled.div`
  display: flex;
  align-items: center;
  background: #ff4d4f;
  color: white;
  padding: 12px 16px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 400px;
`;

const ErrorIcon = styled.span`
  margin-right: 8px;
  font-size: 16px;
`;

const ErrorMessage = styled.div`
  flex: 1;
  margin-right: 12px;
  font-size: 14px;
`;

const RetryButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 8px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 0.8;
  }
`;
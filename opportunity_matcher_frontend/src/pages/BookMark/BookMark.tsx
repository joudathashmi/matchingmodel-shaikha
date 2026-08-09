import React, { useEffect, useState } from "react";
import styled from "styled-components";
import AppShell from "../../components/AppShell";
import BookmarkDashboard from "./BookMarkDashboard";
import { useDispatch, useSelector } from "react-redux";
import { getAllBookmarksRequest } from "../../store/actions/getAllBookmarkActions";
import { selectAllBookmarks, selectBookmarksLoading, selectBookmarksError } from "../../store/selectors/getAllBookmarkSelectors";
import { deleteBookmarkRequest } from '../../store/actions/deleteBookmarkActions';
import {
  selectDeleteBookmarkLoading,
  selectDeleteBookmarkSuccess,
  selectDeleteBookmarkError
} from '../../store/selectors/deleteBookmarkSelectors';
import { AppDispatch } from '../../store';

import { selectCompanyDetails, selectCompanyDetailsError, selectCompanyDetailsLoading } from "../../store/selectors/getCompanyDetailsSelectors";
import { clearCompanyDetails, getCompanyDetailsRequest } from "../../store/actions/getCompanyDetailsActions";
import CompanyDetailPopup from "../CompanyProfile/Cards/CompanyDetailPopup";
// Import the new opportunity details actions and selectors
import { getOpportunityDetailsRequest } from '../../store/actions/opportunityDetailsActions';
import {
  selectOpportunityDetails,
  selectOpportunityDetailsLoading, selectOpportunityDetailsError
} from '../../store/selectors/opportunityDetailsSelectors';
import OpportunitiesPopup from '../InvestmentOpportunities/Card/CardPopup';
import typography from "../../common/typography";

const BookMark: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const bookmarks = useSelector(selectAllBookmarks);
  const loading = useSelector(selectBookmarksLoading);
  const error = useSelector(selectBookmarksError);

  type PopupType = 'analyze' | 'compare' | null;
  const [popupType, setPopupType] = useState<PopupType | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  // Add selectors for delete state
  const deleteLoading = useSelector(selectDeleteBookmarkLoading);
  const deleteSuccess = useSelector(selectDeleteBookmarkSuccess);
  const deleteError = useSelector(selectDeleteBookmarkError);

  useEffect(() => {
    // Fetch bookmarks when component mounts
    dispatch(getAllBookmarksRequest());
  }, [dispatch]);

  // Refetch bookmarks when a delete is successful
  useEffect(() => {
    if (deleteSuccess) {
      dispatch(getAllBookmarksRequest());
    }
  }, [deleteSuccess, dispatch]);

  const handleDeleteBookmark = (bookmarkId: number) => {
    // console.log("opportunityId", bookmarkId);
    const bookmarkData = {
      entityId: bookmarkId,
      entityType: "opportunity"
    };
    dispatch(deleteBookmarkRequest(bookmarkData));
  };

  const [openPopup, setOpenPopup] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  // if (loading) return <div>Loading active matches...</div>;
  const companyDetails = useSelector(selectCompanyDetails);
  const companyDetailsLoading = useSelector(selectCompanyDetailsLoading);
  const companyDetailsError = useSelector(selectCompanyDetailsError);
  useEffect(() => {
    if (selectedCompanyId) {
      dispatch(getCompanyDetailsRequest(selectedCompanyId));
    }
  }, [selectedCompanyId, dispatch]);

  useEffect(() => {
    if (!openPopup) {
      setSelectedCompanyId(null);
      dispatch(clearCompanyDetails());
    }
  }, [openPopup, dispatch]);

  const handleCompanyClick = (companyId: number) => {
    setSelectedCompanyId(companyId);
    setOpenPopup(true);
  };

  const opportunityDetails = useSelector(selectOpportunityDetails);
  const opportunityDetailsLoading = useSelector(selectOpportunityDetailsLoading);
  const opportunityDetailsError = useSelector(selectOpportunityDetailsError);


  const handleButtonClick = (opportunityId: number, type: PopupType) => {
    dispatch(getOpportunityDetailsRequest(opportunityId));
    setPopupType(type);
    setIsPopupOpen(true);

  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    // setPopupType(null);
  };

  const handleAiDecisionFilter = (aiDecision: any) => {
    // Your implementation
    // if (onOpportunityClick) {
    //   onOpportunityClick(aiDecision);
    // }
  };


  return (
    <AppShell>
        <PageHeader>
          <Title>Bookmarks</Title>
          <PageSubtitle>
            Saved companies and opportunities for follow-up
          </PageSubtitle>
        </PageHeader>

        {/* Show delete success message */}
        {/* {deleteSuccess && (
          <SuccessMessage>
            Bookmark deleted successfully!
          </SuccessMessage>
        )} */}

        {/* Show delete error message */}
        {/* {deleteError && (
          <ErrorMessage>
            <strong>Error:</strong> {deleteError}
          </ErrorMessage>
        )}
         */}
        {/* Show loading state */}
        {(loading || deleteLoading) && (
          <Loader>
            <Spinner />
            <span style={{ marginLeft: '1rem' }}>
              {deleteLoading ? 'Deleting bookmark...' : 'Loading bookmarks...'}
            </span>
          </Loader>
        )}

        {/* Show fetch error message */}
        {error && (
          <ErrorMessage>
            <strong>Error:</strong> {error}
          </ErrorMessage>
        )}

        {/* Show bookmarks when not loading and no errors */}
        {!loading && !error && (
          <BookmarkDashboard
            bookmarks={bookmarks}
            onDeleteBookmark={handleDeleteBookmark}
            onCompanyClick={handleCompanyClick}
            onOpportunityClick={handleButtonClick}
          />
        )}


        {openPopup && (
          <CompanyDetailPopup
            companyId={selectedCompanyId}
            companyDetails={companyDetails}
            loading={companyDetailsLoading}
            error={companyDetailsError}
            onClose={() => setOpenPopup(false)}
          />
        )}

        
        {isPopupOpen && (
          <OpportunitiesPopup
            investment={{
              id: 1,
              opportunityName: 'asd',
              opportunitySector: "string",
              opportunityUrl: "string",
              avgSectorSimilarity: 0,
              avgProfileSimilarity: 0,
              avgProductSimilarity: 0,
              avgAiScore: 0,
              avgFinalScore: 0,
              totalCompaniesMatched: 0,
              isBookmarked: false,
              investmentRange: "",
              jobsCreated: "",
              keyDemandDrivers: "",
              gdpImpact: "",
              investmentAppeal: "",
              economicImpact: "",
              marketReadiness: "",
              valueProposition: ""
            }}
            onClose={handleClosePopup}
            detailedData={opportunityDetails || undefined}
            loading={opportunityDetailsLoading}
            error={opportunityDetailsError}
            onOpportunityClick={handleAiDecisionFilter}
            popupType={popupType}
          />
        )}
    </AppShell>
  );
}

export default BookMark;

const BREAKPOINTS = {
  MOBILE: '768px',
  TABLET: '1024px',
  LAPTOP: '1440px',
  DESKTOP: '1920px',
  QHD: '2560px',
  UHD: '3840px' // 4K
};

const DashboardDiv = styled.div` 
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: 84px 1fr;
  height: 100vh;
  width: 100vw;
  overflow-x: hidden;

  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr;
    grid-template-areas: 
      "header"
      "sidebar"
      "content";
    height: auto;
    min-height: 100vh;
  }

  @media (min-width: ${BREAKPOINTS.MOBILE}) and (max-width: ${BREAKPOINTS.TABLET}) {
    grid-template-columns: 200px 1fr;
    grid-template-rows: auto 1fr;
  }

  @media (min-width: ${BREAKPOINTS.TABLET}) and (max-width: ${BREAKPOINTS.LAPTOP}) {
    grid-template-columns: 220px 1fr;
    grid-template-rows: auto 1fr;
  }

  @media (min-width: ${BREAKPOINTS.LAPTOP}) and (max-width: ${BREAKPOINTS.DESKTOP}) {
    grid-template-columns: 250px 1fr;
    grid-template-rows: auto 1fr;
  }

  @media (min-width: ${BREAKPOINTS.DESKTOP}) and (max-width: ${BREAKPOINTS.QHD}) {
    grid-template-columns: 300px 1fr;
    grid-template-rows: auto 1fr;
  }

  @media (min-width: ${BREAKPOINTS.QHD}) {
    grid-template-columns: 400px 1fr;
    grid-template-rows: auto 1fr;
  }
`;

const HeaderWrapper = styled.div`
  grid-column: 1 / -1;
  grid-row: 1 / 2;
  position: sticky;
  top: 0;
  z-index: 20;

  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    grid-area: header;
    position: static;
  }
`;

const Sidebar = styled.div`
  grid-column: 1 / 2;
  grid-row: 2 / -1;
  background: rgba(255, 255, 255, 0.03);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;

  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    grid-area: sidebar;
    grid-column: 1;
    grid-row: auto;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    max-height: 300px;
  }
`;

const Content = styled.div`
  grid-column: 2 / -1;
  grid-row: 2 / -1;
  overflow-y: auto;
  min-height: 0;
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ace7ff;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #8fd3fe;
  }

  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    grid-area: content;
    grid-column: 1;
    grid-row: auto;
    padding: 0.75rem;
  }

  @media (min-width: ${BREAKPOINTS.MOBILE}) and (max-width: ${BREAKPOINTS.TABLET}) {
    padding: 0.9rem;
  }

  @media (min-width: ${BREAKPOINTS.TABLET}) and (max-width: ${BREAKPOINTS.LAPTOP}) {
    padding: 1rem;
  }

  @media (min-width: ${BREAKPOINTS.LAPTOP}) and (max-width: ${BREAKPOINTS.DESKTOP}) {
    padding: 1.1rem;
  }

  @media (min-width: ${BREAKPOINTS.DESKTOP}) and (max-width: ${BREAKPOINTS.QHD}) {
    padding: 1.25rem;
  }

  @media (min-width: ${BREAKPOINTS.QHD}) {
    padding: 1.5rem;
    
    &::-webkit-scrollbar {
      width: 14px;
    }
  }
`;

const Loader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: ${typography.pageTitleSmall.fontSize};
  font-weight: ${typography.pageTitleSmall.fontWeight};
  color: #3498db;

  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    height: 150px;
  }

  @media (min-width: ${BREAKPOINTS.QHD}) {
    height: 300px;
  }
`;

const ErrorMessage = styled.div`
  background-color: #ffe6e6;
  color: #d32f2f;
  font-size: ${typography.pageTitleSmall.fontSize};
  font-weight: ${typography.pageTitleSmall.fontWeight};
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem;
  border-left: 4px solid #d32f2f;

  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    padding: 0.75rem;
    margin: 0.75rem;
  }

  @media (min-width: ${BREAKPOINTS.QHD}) {
    padding: 1.5rem;
    margin: 1.5rem;
  }
`;

const SuccessMessage = styled.div`
  background-color: #e6ffe6;
  color: #2e7d32;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem;
  border-left: 4px solid #2e7d32;

  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    padding: 0.75rem;
    margin: 0.75rem;
  }

  @media (min-width: ${BREAKPOINTS.QHD}) {
    padding: 1.5rem;
    margin: 1.5rem;
  }
`;

const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    width: 30px;
    height: 30px;
    border-width: 3px;
  }

  @media (min-width: ${BREAKPOINTS.QHD}) {
    width: 60px;
    height: 60px;
    border-width: 5px;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 1.25rem;
`;

const Title = styled.h1`
  font-size: ${typography.pageTitle.fontSize};
  font-weight: ${typography.pageTitle.fontWeight};
  color: #ffffff;
  margin: 0 0 0.4rem 0;
  letter-spacing: -0.01em;
  line-height: 1.2;
`;

const PageSubtitle = styled.p`
  margin: 0;
  font-size: ${typography.paragraph.fontSize};
  font-weight: ${typography.paragraph.fontWeight};
  color: rgba(255, 255, 255, 0.62);
  line-height: 1.45;
`;
// BookMarkDashboard.tsx
import React from 'react';
import styled from 'styled-components';
import { Bookmark } from '../../store/types/getAllBookmarkTypes'; // Import your existing type
import deleteIcon from '../../assets/Invest-opportunity-icons/delete-02.svg';
import typography from '../../common/typography';

type PopupType = 'analyze' | 'compare' | null;
interface BookmarkDashboardProps {
  bookmarks: Bookmark[];
  onDeleteBookmark: (bookmarkId: number) => void;
  onCompanyClick: (companyId: number) => void;
  onOpportunityClick: (opportunityId: number, type: PopupType) => void;
}

const BookmarkDashboard: React.FC<BookmarkDashboardProps> = ({
  bookmarks,
  onDeleteBookmark,
  onCompanyClick,
  onOpportunityClick
}) => {
  // Handle the case where there are no bookmarks
  if (!bookmarks || bookmarks.length === 0) {
    return (
      <Container>
        <EmptyState>
          <EmptyTitle>No bookmarks yet</EmptyTitle>
          <EmptyText>
            Save companies or opportunities from Catalogs to find them here later.
          </EmptyText>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>

      <BookmarkList>
        {bookmarks.map((bookmark) => (
          <BookmarkItem key={bookmark.id}>
            <BookmarkInfo>
              <BookmarkName>
                <span>
                  {bookmark.details?.company_name && bookmark.details?.opportunity_name ? (
                    <>
                      <span className="gradient-text" onClick={() => bookmark.details && onCompanyClick(bookmark.details.company_id)}>
                        {bookmark.details.company_name}
                      </span>
                      {" - "}
                      <span style={{ cursor: "pointer" }} onClick={() => bookmark.details && onOpportunityClick(bookmark.details.opportunity_id, null)}>
                        {bookmark.details.opportunity_name}
                      </span>
                    </>
                  ) : (
                    <span style={{ cursor: "pointer" }} onClick={() => bookmark.details && onOpportunityClick(bookmark.details.id, null)}>{bookmark.details?.name || "Unnamed Opportunity"}</span>
                  )}
                </span>
              </BookmarkName>
              <BookmarkSector>Sector: {bookmark.details?.company_sector && bookmark.details?.opportunity_sector
                ? <>
                  <span>{bookmark?.details?.company_sector || "Not specified"}</span>{" - "}
                  <span>{bookmark?.details?.opportunity_sector || "Not specified"}</span>
                </>
                : bookmark.details?.sector || 'Not specified'}</BookmarkSector>
              {bookmark.details?.company_url && (
                <BookmarkLink
                  href={bookmark.details.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginRight: "2rem" }}
                >
                  View Company
                </BookmarkLink>
              )}
              {bookmark.details?.opportunity_url && (
                <BookmarkLink
                  href={bookmark.details.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Opportunity
                </BookmarkLink>
              )}
              {bookmark.details?.url && (
                <BookmarkLink
                  href={bookmark.details.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Opportunity
                </BookmarkLink>
              )}
            </BookmarkInfo>
            <DeleteButton onClick={() => onDeleteBookmark(bookmark.entityId)}>
              <DeleteIcon src={deleteIcon} alt="" />
            </DeleteButton>
          </BookmarkItem>
        ))}
      </BookmarkList>
    </Container>
  );
};

export default BookmarkDashboard;

const BREAKPOINTS = {
  MOBILE: '768px',
  TABLET: '1024px',
  LAPTOP: '1440px',
  DESKTOP: '1920px',
  QHD: '2560px',
  UHD: '3840px' // 4K
};

const Container = styled.div`
  margin-top:1rem;
  max-width: 1200px;

  @media (min-width: ${BREAKPOINTS.MOBILE}) {
  
  }

  @media (min-width: ${BREAKPOINTS.TABLET}) {
   
  }

  @media (min-width: ${BREAKPOINTS.LAPTOP}) {
       max-width: 1415px;
  }

  @media (min-width: ${BREAKPOINTS.DESKTOP}) {
    max-width: 2010px;
  }

  @media (min-width: ${BREAKPOINTS.QHD}) {
    max-width: 2619px;
  }

  @media (min-width: ${BREAKPOINTS.UHD}) {
    max-width: 4170px;
   
  }
`;

const Title = styled.h1`
  font-size: ${typography.pageTitle.fontSize};
  font-weight: ${typography.pageTitle.fontWeight};
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-weight: 600;

  @media (min-width: ${BREAKPOINTS.MOBILE}) {
    margin-bottom: 1.75rem;
  }

  @media (min-width: ${BREAKPOINTS.TABLET}) {
    margin-bottom: 2rem;
  }

  @media (min-width: ${BREAKPOINTS.UHD}) {
    margin-bottom: 3rem;
  }
`;

const BookmarkList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (min-width: ${BREAKPOINTS.MOBILE}) {
    gap: 0.9rem;
  }

  @media (min-width: ${BREAKPOINTS.TABLET}) {
    gap: 1rem;
  }

  @media (min-width: ${BREAKPOINTS.LAPTOP}) {
    gap: 1.1rem;
  }

  @media (min-width: ${BREAKPOINTS.DESKTOP}) {
    gap: 1.25rem;
  }

  @media (min-width: ${BREAKPOINTS.UHD}) {
    gap: 1.5rem;
  }
`;

const BookmarkItem = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem;
  background-color: rgba(71, 123, 195, 0.1);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
  gap: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  @media (min-width: ${BREAKPOINTS.MOBILE}) {
    flex-direction: row;
    align-items: center;
    padding: 1.5rem;
    gap: 0;
  }

  @media (min-width: ${BREAKPOINTS.TABLET}) {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    
    &:hover {
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
    }
  }

  @media (min-width: ${BREAKPOINTS.LAPTOP}) {
    padding: 1.75rem;
  }

  @media (min-width: ${BREAKPOINTS.DESKTOP}) {
    padding: 2rem;
  }

  @media (min-width: ${BREAKPOINTS.QHD}) {
    padding: 2.25rem;
  }

  @media (min-width: ${BREAKPOINTS.UHD}) {
    padding: 2.5rem;
    border-radius: 12px;
    
    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }
  }
`;

const BookmarkInfo = styled.div`
  flex: 1;
  width: 100%;

  @media (min-width: ${BREAKPOINTS.MOBILE}) {
    width: auto;
  }
`;

const BookmarkName = styled.h3`
  font-size: ${typography.datasHeading.fontSize};
  font-weight: ${typography.datasHeading.fontWeight};
  color: white;
  margin: 0 0 0.5rem 0;
  word-break: break-word;
  span.gradient-text{
     background: linear-gradient(45deg, #00ff88, #00b4d8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: ${typography.datasHeading.fontWeight};
    cursor:pointer;
    }
  @media (min-width: ${BREAKPOINTS.UHD}) {
    margin-bottom: 0.75rem;
  }
`;

const BookmarkSector = styled.p`
  color: #7f8c8d;
  margin: 0 0 0.5rem 0;
  font-size: ${typography.datasSubHeading.fontSize};
  font-weight: ${typography.datasSubHeading.fontWeight};
  word-break: break-word;

  @media (min-width: ${BREAKPOINTS.UHD}) {
    margin-bottom: 0.75rem;
  }
`;

const BookmarkLink = styled.a`
  color: #3498db;
  text-decoration: none;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  display: inline-flex;
  align-items: center;
  margin-bottom: 1rem;
  word-break: break-all;
  
  &:hover {
    text-decoration: underline;
    color: #2980b9;
  }
  
  &::after {
    content: '↗';
    margin-left: 0.3rem;
    font-size: ${typography.button.fontSize};
    font-weight: ${typography.button.fontWeight};

  }

  @media (min-width: ${BREAKPOINTS.MOBILE}) {
    margin-bottom: 0;
    word-break: break-word;
  }

  @media (min-width: ${BREAKPOINTS.UHD}) {
    
    &::after {
      margin-left: 0.5rem;
    }
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  
  align-self: flex-start; 
  margin-top: 0; 
  
  @media (min-width: ${BREAKPOINTS.MOBILE}) {
    position: static;
    margin-top: 0;
  }

  @media (min-width: ${BREAKPOINTS.TABLET}) {
   
  }

  @media (min-width: ${BREAKPOINTS.LAPTOP}) {
   
  }

  @media (min-width: ${BREAKPOINTS.DESKTOP}) {
   
  }

  @media (min-width: ${BREAKPOINTS.UHD}) {
    
  }
`;

const DeleteIcon = styled.img`
  width: 20px;
  height: 20px;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }

  @media (min-width: ${BREAKPOINTS.MOBILE}) {
    width: 22px;
    height: 22px;
  }

  @media (min-width: ${BREAKPOINTS.TABLET}) {
    width: 24px;
    height: 24px;
  }

  @media (min-width: ${BREAKPOINTS.LAPTOP}) {
    width: 26px;
    height: 26px;
  }

  @media (min-width: ${BREAKPOINTS.DESKTOP}) {
    width: 28px;
    height: 28px;
  }

  @media (min-width: ${BREAKPOINTS.QHD}) {
    width: 32px;
    height: 32px;
  }

  @media (min-width: ${BREAKPOINTS.UHD}) {
    width: 36px;
    height: 36px;
  }
`;


const EmptyState = styled.div`
  max-width: 28rem;
  padding: 1.25rem 1.35rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  text-align: left;
`;

const EmptyTitle = styled.h2`
  margin: 0 0 0.35rem;
  font-size: ${typography.smallTitle.fontSize};
  font-weight: ${typography.smallTitle.fontWeight};
  color: #ffffff;
`;

const EmptyText = styled.p`
  margin: 0;
  font-size: ${typography.paragraph.fontSize};
  font-weight: ${typography.paragraph.fontWeight};
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.45;
`;
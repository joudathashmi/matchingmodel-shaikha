// components/Pagination.tsx
import React from 'react';
import styled from 'styled-components';
import typography from '../common/typography';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  limit,
  loading = false,
  onPageChange,
}) => {
  // Generate page numbers like Discovery Engine
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let startPage = Math.max(2, currentPage - 2);
      let endPage = Math.min(totalPages - 1, currentPage + 2);

      if (startPage > 2) pages.push('...');
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !loading) {
      onPageChange(page);
    }
  };

  const startIndex = ((currentPage - 1) * limit) + 1;
  const endIndex = Math.min(currentPage * limit, totalRecords);

  if (totalRecords === 0) return null;

  return (
    <TablePagination>
      <PaginationInfo>
        Showing {startIndex}-{endIndex} of {totalRecords} records
      </PaginationInfo>

      <PaginationControls>
        <PaginationButton
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1 || loading}
        >
          ← Previous
        </PaginationButton>

        <PageNumbers>
          {generatePageNumbers().map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} style={{ padding: '0.5rem' }}>...</span>
            ) : (
              <PaginationButton
                key={page}
                onClick={() => changePage(page as number)}
                disabled={currentPage === page || loading}
                className={currentPage === page ? 'active' : ''}
              >
                {page}
              </PaginationButton>
            )
          )}
        </PageNumbers>

        <PaginationButton
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
        >
          Next →
        </PaginationButton>
      </PaginationControls>
    </TablePagination>
  );
};

export default Pagination;

// Styled Components (same as your existing styles)
const TablePagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  @media (min-width: 1921px) {
    gap: 1.5rem;
  }

  @media (max-width: 1200px) {
    flex-direction: column;
    text-align: center;
  }
`;

const PaginationInfo = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: ${typography.paginateRecords.fontSize};
  font-weight: ${typography.paginateRecords.fontWeight};
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (min-width: 1921px) {
    gap: 0.75rem;
  }
`;

const PaginationButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  padding: 0.5rem 1rem;
  font-size: ${typography.paginationButtons.fontSize};
  font-weight: ${typography.paginationButtons.fontWeight};
  cursor: pointer;
  transition: all 0.3s ease;

  @media (min-width: 1921px) {
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
  }

  &:hover:not(:disabled) {
    background: rgba(0, 255, 136, 0.1);
    border-color: #00ff88;
    color: #00ff88;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.active {
    background: rgba(0, 255, 136, 0.2);
    border-color: #00ff88;
    color: #00ff88;
  }
`;

const PageNumbers = styled.div`
  display: flex;
  gap: 0.25rem;

  @media (min-width: 1921px) {
    gap: 0.5rem;
  }

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;
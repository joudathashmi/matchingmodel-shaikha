import styled from 'styled-components';
import typography from '../typography';

export type ErrorType = string | Error | { message?: string };

interface ErrorMessageProps {
  error: ErrorType;
  translateX?: string; 
}

const FullScreenContainer = styled.div<{ $translateX?: string }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transform: ${props => props.$translateX ? `translateX(${props.$translateX})` : 'translateX(100px)'};
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 1.35rem 1.5rem;
  text-align: left;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 12px;
  margin: 1rem;
  max-width: 420px;
`;

const ErrorMessageText = styled.p`
  font-size: ${typography.smallTitle.fontSize};
  font-weight: ${typography.smallTitle.fontWeight};
  color: #fecaca;
  margin: 0 0 0.35rem;
`;

const ErrorDetails = styled.p`
  font-size: ${typography.paragraph.fontSize};
  font-weight: ${typography.paragraph.fontWeight};
  color: rgba(255, 255, 255, 0.65);
  margin: 0;
  line-height: 1.45;
`;

export const ErrorMessage = ({ error, translateX = '100px' }: ErrorMessageProps) => {
  let errorMessage = 'Please try again later.';

  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = error.message || 'Please try again later.';
  }

  return (
    <FullScreenContainer $translateX={translateX}>
      <ErrorContainer>
        <ErrorMessageText>Something went wrong</ErrorMessageText>
        <ErrorDetails>{errorMessage}</ErrorDetails>
      </ErrorContainer>
    </FullScreenContainer>
  );
};

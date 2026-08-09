import styled, { keyframes } from 'styled-components';
import typography from '../typography';

interface LoadingSpinnerWithMessageProps {
  message: string;
  translateX?: string; 
}

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

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

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 28px;
  height: 28px;
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-top: 2px solid rgba(0, 255, 136, 0.85);
  border-radius: 50%;
  animation: ${spin} 0.85s linear infinite;
  margin-bottom: 1rem;
`;

const LoadingMessage = styled.p`
  font-size: ${typography.paragraph.fontSize};
  font-weight: ${typography.paragraph.fontWeight};
  color: rgba(255, 255, 255, 0.62);
  margin: 0;
  letter-spacing: -0.01em;
`;

export const LoadingSpinnerWithMessage = ({ 
  message,
  translateX = '100px'
}: LoadingSpinnerWithMessageProps) => (
  <FullScreenContainer $translateX={translateX}>
    <LoadingContainer>
      <LoadingSpinner />
      <LoadingMessage>{message}</LoadingMessage>
    </LoadingContainer>
  </FullScreenContainer>
);

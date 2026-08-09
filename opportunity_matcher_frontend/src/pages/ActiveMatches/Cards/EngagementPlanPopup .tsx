import React, { useState } from 'react';
import styled from 'styled-components';
import typography from '../../../common/typography';

// Add the EngagementPlanPopup component definition
interface EngagementPlanPopupProps {
    isOpen: boolean;
    onClose: () => void;
    match: any; // Replace 'any' with your specific match type if available
}

const EngagementPlanPopup: React.FC<EngagementPlanPopupProps> = ({ isOpen, onClose, match }) => {
    if (!isOpen) return null;

    return (
        <PopupOverlay onClick={onClose}>
            <PopupContent onClick={(e) => e.stopPropagation()}>
                <PopupHeader>
                    <Heading >Suggest Engagement Plan</Heading>
                    <CloseButton onClick={onClose}>×</CloseButton>
                </PopupHeader>

                <PopupBody>
                    {/* <h3>For: {match?.companyName}</h3> */}
                    {/* <p> {match}</p> */}

                    {((match as unknown) as string[])?.map((reason, index) => (
                        <Para key={index} >
                            {reason}
                        </Para>
                    ))}
                </PopupBody>

                {/* <PopupFooter> */}
                {/* <Btn variant="secondary" onClick={onClose}>Cancel</Btn> */}

                {/* </PopupFooter> */}
            </PopupContent>
        </PopupOverlay>
    );
};

export default EngagementPlanPopup
// Standard device breakpoints (based on common screen sizes)
const breakpoints = {
    mobileSmall: '320px',     // Small phones
    mobileMedium: '375px',    // Average phones
    mobileLarge: '425px',     // Large phones
    tablet: '768px',          // Tablets (iPad, etc.)
    laptopSmall: '1024px',    // Small laptops
    laptop: '1440px',         // Standard laptops/desktops
    desktop: '1920px',        // Full HD desktops
    desktopLarge: '2560px',   // 2K/QHD displays
    desktop4K: '3840px'       // 4K/UHD displays
};

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.17);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;

  @media (max-width: ${breakpoints.mobileMedium}) {
    padding: 0.5rem;
    align-items: flex-start;
    padding-top: 2rem;
    backdrop-filter: blur(2px);
  }

  @media (min-width: ${breakpoints.mobileMedium}) and (max-width: ${breakpoints.mobileLarge}) {
    padding: 0.75rem;
    align-items: flex-start;
    padding-top: 2.5rem;
  }

  @media (min-width: ${breakpoints.mobileLarge}) and (max-width: calc(${breakpoints.tablet} - 1px)) {
    padding: 1rem;
    align-items: flex-start;
    padding-top: 3rem;
  }

  @media (min-width: ${breakpoints.tablet}) and (max-width: calc(${breakpoints.laptopSmall} - 1px)) {
    padding: 1.5rem;
  }

  @media (min-width: ${breakpoints.laptopSmall}) and (max-width: calc(${breakpoints.laptop} - 1px)) {
    padding: 2rem;
  }

  @media (min-width: ${breakpoints.laptop}) and (max-width: calc(${breakpoints.desktop} - 1px)) {
    padding: 2.5rem;
  }

  @media (min-width: ${breakpoints.desktop}) and (max-width: calc(${breakpoints.desktopLarge} - 1px)) {
    padding: 3rem;
  }

  @media (min-width: ${breakpoints.desktopLarge}) and (max-width: calc(${breakpoints.desktop4K} - 1px)) {
    padding: 4rem;
  }

  @media (min-width: ${breakpoints.desktop4K}) {
    padding: 5rem;
  }
`;

const PopupContent = styled.div`
  background: rgba(38, 43, 65, 1);
  border-radius: 8px;
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  @media (max-width: ${breakpoints.mobileMedium}) {
    width: 95%;
    max-width: 100%;
    max-height: 85vh;
    border-radius: 6px;
  }

  @media (min-width: ${breakpoints.mobileMedium}) and (max-width: ${breakpoints.mobileLarge}) {
    width: 92%;
    max-width: 100%;
    max-height: 85vh;
    border-radius: 8px;
  }

  @media (min-width: ${breakpoints.mobileLarge}) and (max-width: calc(${breakpoints.tablet} - 1px)) {
    width: 90%;
    max-width: 100%;
    max-height: 85vh;
    border-radius: 10px;
  }

  @media (min-width: ${breakpoints.tablet}) and (max-width: calc(${breakpoints.laptopSmall} - 1px)) {
    width: 85%;
    max-width: 800px;
    border-radius: 10px;
  }

  @media (min-width: ${breakpoints.laptopSmall}) and (max-width: calc(${breakpoints.laptop} - 1px)) {
    width: 80%;
    max-width: 850px;
    border-radius: 10px;
  }

  @media (min-width: ${breakpoints.laptop}) and (max-width: calc(${breakpoints.desktop} - 1px)) {
    width: 75%;
    max-width: 900px;
    border-radius: 12px;
  }

  @media (min-width: ${breakpoints.desktop}) and (max-width: calc(${breakpoints.desktopLarge} - 1px)) {
    width: 70%;
    max-width: 1400px;
    border-radius: 12px;
  }

  @media (min-width: ${breakpoints.desktopLarge}) and (max-width: calc(${breakpoints.desktop4K} - 1px)) {
    width: 65%;
    max-width: 1200px;
    border-radius: 14px;
  }

  @media (min-width: ${breakpoints.desktop4K}) {
    width: 60%;
    max-width: 1400px;
    border-radius: 16px;
  }
`;

const PopupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;

  @media (max-width: calc(${breakpoints.tablet} - 1px)) {
    padding: 0.75rem 1rem;
    position: sticky;
    top: 0;
    background: rgba(38, 43, 65, 1);
    z-index: 10;
  }

  @media (min-width: ${breakpoints.tablet}) and (max-width: calc(${breakpoints.laptopSmall} - 1px)) {
    padding: 1rem 1.5rem;
  }

  @media (min-width: ${breakpoints.laptopSmall}) and (max-width: calc(${breakpoints.laptop} - 1px)) {
    padding: 1.25rem 1.75rem;
  }

  @media (min-width: ${breakpoints.laptop}) {
    padding: 1.5rem 2rem;
  }

  @media (min-width: ${breakpoints.desktop4K}) {
    padding: 2rem 3rem;
  }
`;
const Heading = styled.h3`
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  color: rgb(0, 230, 118);
  margin:0;
`;

const Para = styled.p`
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
  margin: "0.7rem 0 0 0";
`;
const PopupBody = styled.div`
  padding: 0 2rem 2rem 2rem;

  @media (max-width: ${breakpoints.mobileMedium}) {
    padding: 0 0.75rem 1rem 0.75rem;
  }

  @media (min-width: ${breakpoints.mobileMedium}) and (max-width: calc(${breakpoints.tablet} - 1px)) {
    padding: 0 1rem 1.5rem 1rem;
  }

  @media (min-width: ${breakpoints.tablet}) and (max-width: calc(${breakpoints.laptopSmall} - 1px)) {
    padding: 0 1.5rem 1.5rem 1.5rem;
  }

  @media (min-width: ${breakpoints.laptopSmall}) and (max-width: calc(${breakpoints.laptop} - 1px)) {
    padding: 0 1.75rem 1.75rem 1.75rem;
  }

  @media (min-width: ${breakpoints.laptop}) and (max-width: calc(${breakpoints.desktop} - 1px)) {
    padding: 0 2rem 2rem 2rem;
  }

  @media (min-width: ${breakpoints.desktop}) and (max-width: calc(${breakpoints.desktop4K} - 1px)) {
    padding: 0 2.5rem 2.5rem 2.5rem;
  }

  @media (min-width: ${breakpoints.desktop4K}) {
    padding: 0 3rem 3rem 3rem;
  }
`;

const PopupFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #e0e0e0;

  @media (max-width: calc(${breakpoints.tablet} - 1px)) {
    padding: 0.75rem 1rem;
    flex-direction: column-reverse;
    gap: 0.75rem;
    
    & > * {
      width: 100%;
    }
  }

  @media (min-width: ${breakpoints.tablet}) and (max-width: calc(${breakpoints.laptopSmall} - 1px)) {
    padding: 1rem 1.5rem;
    gap: 0.75rem;
  }

  @media (min-width: ${breakpoints.laptopSmall}) {
    padding: 1.25rem 2rem;
    gap: 1rem;
  }

  @media (min-width: ${breakpoints.desktop4K}) {
    padding: 1.5rem 3rem;
    gap: 1.25rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  color: #333;
  transition: all 0.2s ease;

  @media (max-width: calc(${breakpoints.tablet} - 1px)) {
    width: 28px;
    height: 28px;
  }

  @media (min-width: ${breakpoints.tablet}) and (max-width: calc(${breakpoints.laptopSmall} - 1px)) {
    width: 32px;
    height: 32px;
  }

  @media (min-width: ${breakpoints.laptop}) and (max-width: calc(${breakpoints.desktopLarge} - 1px)) {
    width: 36px;
    height: 36px;
    
    &:hover {
      background-color: #e0e0e0;
      transform: scale(1.05);
    }
  }

  @media (min-width: ${breakpoints.desktopLarge}) {
    width: 40px;
    height: 40px;
  }
`;

export { breakpoints };
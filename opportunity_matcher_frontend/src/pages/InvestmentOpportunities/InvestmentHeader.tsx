
import styled, { keyframes } from "styled-components";
import inpIcon from '../../assets/icons/search-01.svg'
import notificationIcon from '../../assets/icons/notification-02.svg'
import logoImg from '../../assets/Login-page-icon/Ministry_of_Investment_Logo-white.svg'


const HeaderDiv = styled.header`
  grid-column: 1 / -1;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;

  /* ✅ Tablet & Mobile responsive */
  @media (max-width: 1024px) {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }
`;


const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;
const SearchInput = styled.input.attrs({ type: "text" })`
  background: linear-gradient(
    135deg,
    rgba(0, 255, 136, 0.1) 0%,
    rgba(0, 180, 216, 0.1) 100%
  );
  border: 2px solid transparent;
  border-radius: 50px;
  padding: 0.5rem 3rem 0.5rem 4rem;
  color: white;
  width: 550px;
  font-size: 1.1rem;
  font-weight: 500;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  backdrop-filter: blur(20px);
  

  &:focus {
    outline: none;
    border: 2px solid #00ff88;
    background: linear-gradient(
      135deg,
      rgba(0, 255, 136, 0.15) 0%,
      rgba(0, 180, 216, 0.15) 100%
    );
    box-shadow: 0 12px 40px rgba(0, 255, 136, 0.25),
      inset 0 2px 10px rgba(0, 255, 136, 0.1);
    transform: translateY(-2px);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
    font-weight: 400;
  }

  /* ✅ Responsive widths */
  @media (max-width: 1024px) {
    width: 80%;
  }
  @media (max-width: 768px) {
    width: 100%;
  }
`;
const SearchIcon = styled.img`
  position: absolute;
  left: 1.2rem;
  color: #00ff88;
  font-size: 1.3rem;
  pointer-events: none;
  transition: all 0.3s ease;
`;
const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;
const RelativeDiv = styled.div`
  position: relative;
`;
const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const NotificationBadge = styled.div`
  background: #ff6b6b;
  color: white;
  border-radius: 50%;
  width: 8px;
  height: 8px;
  position: absolute;
  top: -2px;
  right: -2px;
  animation: ${pulseAnimation} 2s infinite;
`;
const LogoIcon = styled.img`
  height: 50px;         /* default desktop size */
  width: auto;          /* maintain aspect ratio */
  object-fit: contain;  

  @media (max-width: 1024px) {
    height: 40px;       /* tablet */ 
  }
  @media (max-width: 768px) {
    height: 32px;       /* mobile */
  }
`;



const ActiveMatchesHeader: React.FC= ( ) => {
  return (
      <HeaderDiv>
        <LogoIcon src={logoImg} />
        <SearchContainer>
          <SearchInput placeholder="Search opportunities, companies, sectors..." />
          <SearchIcon src={inpIcon} />
        </SearchContainer>
        <UserInfo>
          {/* <RelativeDiv>
            <img src={notificationIcon} alt="" />
            <NotificationBadge />
          </RelativeDiv>
          <span>{subLabel}</span> */}

        </UserInfo>
      </HeaderDiv>
  );
}

export default ActiveMatchesHeader;

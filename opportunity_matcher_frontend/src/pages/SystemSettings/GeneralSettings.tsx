import styled from "styled-components";
import { useState } from "react";
import i18n from "i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import typography from "../../common/typography";
import { useTourOptional } from "../../tour/TourContext";

const BREAKPOINTS = {
  MOBILE: '768px',
  TABLET: '1024px',
  LAPTOP: '1440px',
  DESKTOP: '1920px',
  QHD: '2560px',
  UHD: '3840px' // 4K
};

// Responsive mixins for easier media queries
const media = {
  mobile: `@media (max-width: ${BREAKPOINTS.MOBILE})`,
  tablet: `@media (min-width: ${BREAKPOINTS.MOBILE}) and (max-width: ${BREAKPOINTS.TABLET})`,
  laptop: `@media (min-width: ${BREAKPOINTS.TABLET}) and (max-width: ${BREAKPOINTS.LAPTOP})`,
  desktop: `@media (min-width: ${BREAKPOINTS.LAPTOP}) and (max-width: ${BREAKPOINTS.DESKTOP})`,
  qhd: `@media (min-width: ${BREAKPOINTS.DESKTOP}) and (max-width: ${BREAKPOINTS.QHD})`,
  uhd: `@media (min-width: ${BREAKPOINTS.QHD})`,
  touch: `@media (hover: none) and (pointer: coarse)`,
  reducedMotion: `@media (prefers-reduced-motion: reduce)`
};

const SettingsContainer = styled.div`
  max-width: 720px;
  margin: 0;
  color: #ffffff;
  padding: 0;
  box-sizing: border-box;
  font-family: "DM Sans", sans-serif;
`;

const Section = styled.div`
  margin-bottom: 3rem;

  ${media.tablet} {
    margin-bottom: 2.5rem;
  }

  ${media.mobile} {
    margin-bottom: 2rem;
  }

  ${media.uhd} {
    margin-bottom: 3.5rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: ${typography.smallTitle.fontSize};
  font-weight: ${typography.smallTitle.fontWeight};
  margin: 0 0 1.25rem;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.3;
`;

const Subsection = styled.div`
  margin-bottom: 2.25rem;

  ${media.tablet} {
    margin-bottom: 2rem;
  }

  ${media.mobile} {
    margin-bottom: 1.75rem;
  }

  ${media.uhd} {
    margin-bottom: 2.75rem;
  }
`;

const SubsectionTitle = styled.h3`
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  margin: 0 0 0.4rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.35;
`;

const Description = styled.p`
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
  color: rgba(255, 255, 255, 0.55);
  margin: 0 0 0.85rem;
  line-height: 1.45;
`;

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  gap: 1.5rem;

  ${media.tablet} {
    padding: 0.875rem 0;
    gap: 1.25rem;
  }

  ${media.mobile} {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem 0;
  }

  ${media.uhd} {
    padding: 1.25rem 0;
    gap: 2rem;
  }

  ${media.touch} {
    min-height: 60px;
  }
`;

const LabelContainer = styled.div`
  flex: 1;
  min-width: 0;

  ${media.mobile} {
    width: 100%;
  }
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 32px;
  flex-shrink: 0;

  ${media.tablet} {
    width: 55px;
    height: 28px;
  }

  ${media.mobile} {
    width: 50px;
    height: 26px;
    align-self: flex-end;
  }

  ${media.uhd} {
    width: 70px;
    height: 36px;
  }

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + span {
      background-color: rgba(0, 200, 140, 0.85);
      
      &:before {
        transform: translateX(28px);
        
        ${media.tablet} {
          transform: translateX(27px);
        }
        
        ${media.mobile} {
          transform: translateX(24px);
        }
        
        ${media.uhd} {
          transform: translateX(34px);
        }
      }
    }

    &:focus-visible + span {
      outline: 2px solid rgba(0, 255, 136, 0.55);
      outline-offset: 2px;
    }
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #666;
    transition: all 0.3s ease;
    border-radius: 34px;

    &:before {
      position: absolute;
      content: "";
      height: 24px;
      width: 24px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: all 0.3s ease;
      border-radius: 50%;
      
      ${media.tablet} {
        height: 22px;
        width: 22px;
      }
      
      ${media.mobile} {
        height: 20px;
        width: 20px;
      }
      
      ${media.uhd} {
        height: 28px;
        width: 28px;
        left: 5px;
        bottom: 4px;
      }
    }
  }

  ${media.reducedMotion} {
    span, span:before {
      transition: none;
    }
  }

  ${media.touch} {
    transform: scale(1.1);
    margin: 0.5rem;
  }
`;

const Dropdown = styled.div`
  position: relative;
  display: inline-block;
  flex-shrink: 0;

  ${media.mobile} {
    width: 100%;
  }
`;

const DropdownButton = styled.button`
  background: transparent;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  min-width: 200px;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
  font-size: ${typography.selectBoxOptions.fontSize};
  font-weight: ${typography.selectBoxOptions.fontWeight};

  &:hover {
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.05);
  }

  &:active {
    transform: translateY(1px);
  }

  ${media.tablet} {
    min-width: 180px;
    padding: 0.625rem 0.875rem;
  }

  ${media.mobile} {
    min-width: 100%;
    width: 100%;
    padding: 0.875rem 1rem;
  }

  ${media.uhd} {
    min-width: 340px;
    padding: 1.25rem 1.25rem;
    border-radius: 10px;
  }

  ${media.reducedMotion} {
    transition: none;
    
    &:active {
      transform: none;
    }
  }

  ${media.touch} {
    min-height: 54px;
  }
`;

const DropdownContent = styled.div<{ isOpen: boolean }>`
  display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
  position: absolute;
  background-color: #2a2e3e;
  min-width: 200px;
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  overflow: hidden;
  right: 0;
  top: 100%;
  margin-top: 0.5rem;

  ${media.tablet} {
    min-width: 180px;
  }

  ${media.mobile} {
    min-width: 100%;
    width: 100%;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    border-radius: 16px 16px 0 0;
    max-height: 60vh;
    overflow-y: auto;
    margin-top: 0;
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.3);
  }

  ${media.uhd} {
    min-width: 340px;
    border-radius: 10px;
  }
`;

const DropdownItem = styled.div`
  color: rgba(255, 255, 255, 0.9);
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: ${typography.selectBoxOptions.fontSize};
  font-weight: ${typography.selectBoxOptions.fontWeight};

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &:active {
    background-color: rgba(255, 255, 255, 0.15);
  }

  ${media.tablet} {
    padding: 0.875rem 1.125rem;
  }

  ${media.mobile} {
    padding: 1.25rem 1.5rem;
    min-height: 60px;
    display: flex;
    align-items: center;
  }

  ${media.uhd} {
    padding: 1rem 1.5rem;
  }

  ${media.reducedMotion} {
    transition: none;
  }

  ${media.touch} {
    min-height: 64px;
  }
`;

const CurrentValue = styled.span`
  color: #9ef0c8;
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
`;

// Additional responsive utility components
const ResponsiveGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;

  ${media.mobile} {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  ${media.uhd} {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
  }
`;

const IconWrapper = styled.span`
  margin-left: 0.5rem;
  transition: transform 0.2s ease;

  ${media.reducedMotion} {
    transition: none;
  }
`;

const TourReplayBtn = styled.button`
  appearance: none;
  background: linear-gradient(135deg, #00ff88, #00b4d8);
  border: none;
  color: #0a0a0a;
  border-radius: 8px;
  padding: 0.55rem 1rem;
  font-family: inherit;
  font-size: ${typography.button.fontSize};
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s ease, filter 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.05);
  }
`;

const GeneralSettings = () => {
  const tour = useTourOptional();
  // Toggle states
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // Dropdown states
  const [language, setLanguage] = useState("English");
  const [timeZone, setTimeZone] = useState("GMT+3 (Riyadh)");
  const [currency, setCurrency] = useState("SAR (Saudi Riyal)");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Dropdown options
  const languageOptions = ["English", "Arabic", "French", "Spanish"];
  const timeZoneOptions = ["GMT+3 (Riyadh)", "GMT+4 (Dubai)", "GMT+0 (London)", "GMT-5 (New York)"];
  const currencyOptions = ["SAR (Saudi Riyal)", "USD (US Dollar)", "EUR (Euro)", "GBP (British Pound)"];

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  // changeLanguage helper
  const handleLanguageChange = (option: string) => {
    setLanguage(option);
    if (option === "English") {
      i18n.changeLanguage("en");   // switch to english
      document.body.dir = "ltr";   // layout direction left → right
    } else if (option === "Arabic") {
      i18n.changeLanguage("ar");   // switch to arabic
      document.body.dir = "rtl";   // layout direction right → left
    }
    setOpenDropdown(null);
  };

  return (
    <SettingsContainer>
      <Section>
        <SectionTitle>Guided tour</SectionTitle>
        <Subsection>
          <SubsectionTitle>Workspace walkthrough</SubsectionTitle>
          <Description>
            Replay the short product tour - Matching overview, Matches, Pursuit, and how
            they connect.
          </Description>
          <SettingRow>
            <CurrentValue>About 1 minute</CurrentValue>
            <TourReplayBtn
              type="button"
              onClick={() => tour?.startTour({ force: true })}
            >
              Start tour
            </TourReplayBtn>
          </SettingRow>
        </Subsection>
      </Section>

      <Section>
        <SectionTitle>Dashboard</SectionTitle>

        <Subsection>
          <SubsectionTitle>Auto-refresh Dashboard</SubsectionTitle>
          <Description>Automatically update dashboard data every 5 minutes</Description>
          <SettingRow>
            <CurrentValue>{autoRefresh ? "Enabled" : "Disabled"}</CurrentValue>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
              />
              <span />
            </ToggleSwitch>
          </SettingRow>
        </Subsection>

        <Subsection>
          <SubsectionTitle>Show Advanced Metrics</SubsectionTitle>
          <Description>Display detailed analytics and technical metrics</Description>
          <SettingRow>
            <CurrentValue>{showMetrics ? "Enabled" : "Disabled"}</CurrentValue>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={showMetrics}
                onChange={() => setShowMetrics(!showMetrics)}
              />
              <span />
            </ToggleSwitch>
          </SettingRow>
        </Subsection>

        <Subsection>
          <SubsectionTitle>Dark Mode</SubsectionTitle>
          <Description>Use dark theme for better visibility</Description>
          <SettingRow>
            <CurrentValue>{darkMode ? "Enabled" : "Disabled"}</CurrentValue>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
              <span />
            </ToggleSwitch>
          </SettingRow>
        </Subsection>
      </Section>

      <Section>
        <SectionTitle>Locale</SectionTitle>

        <Subsection>
          <SubsectionTitle>Language</SubsectionTitle>
          <Description>Select your preferred platform language</Description>
          <SettingRow>
            <CurrentValue>{language}</CurrentValue>
            <Dropdown>
              <DropdownButton onClick={() => toggleDropdown("language")}>
                <span>{language}</span>
                {openDropdown === "language" ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </DropdownButton>
              <DropdownContent isOpen={openDropdown === "language"}>
                {languageOptions.map(option => (
                  <DropdownItem
                    key={option}
                    onClick={() => handleLanguageChange(option)}
                  >
                    {option}
                  </DropdownItem>
                ))}
              </DropdownContent>
            </Dropdown>
          </SettingRow>
        </Subsection>

        <Subsection>
          <SubsectionTitle>Time Zone</SubsectionTitle>
          <Description>Set your local time zone for deadlines and notifications</Description>
          <SettingRow>
            <CurrentValue>{timeZone}</CurrentValue>
            <Dropdown>
              <DropdownButton onClick={() => toggleDropdown("timezone")}>
                <span>{timeZone}</span>
                {openDropdown === "timezone" ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </DropdownButton>
              <DropdownContent isOpen={openDropdown === "timezone"}>
                {timeZoneOptions.map(option => (
                  <DropdownItem
                    key={option}
                    onClick={() => {
                      setTimeZone(option);
                      setOpenDropdown(null);
                    }}
                  >
                    {option}
                  </DropdownItem>
                ))}
              </DropdownContent>
            </Dropdown>
          </SettingRow>
        </Subsection>

        <Subsection>
          <SubsectionTitle>Currency Display</SubsectionTitle>
          <Description>Default currency for financial information</Description>
          <SettingRow>
            <CurrentValue>{currency}</CurrentValue>
            <Dropdown>
              <DropdownButton onClick={() => toggleDropdown("currency")}>
                <span>{currency}</span>
                {openDropdown === "currency" ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </DropdownButton>
              <DropdownContent isOpen={openDropdown === "currency"}>
                {currencyOptions.map(option => (
                  <DropdownItem
                    key={option}
                    onClick={() => {
                      setCurrency(option);
                      setOpenDropdown(null);
                    }}
                  >
                    {option}
                  </DropdownItem>
                ))}
              </DropdownContent>
            </Dropdown>
          </SettingRow>
        </Subsection>
      </Section>
    </SettingsContainer>
  );
};

export default GeneralSettings;
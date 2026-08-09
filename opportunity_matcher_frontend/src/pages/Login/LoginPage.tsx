import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import eyeIcon from "../../assets/eye.svg";
import userIcon from "../../assets/LeadingIcon.svg";
import passwordIcon from "../../assets/passwordlock.svg";
import closeEye from "../../assets/eye-slash.svg";
import loginLogo from '../../assets/Login-page-icon/Ministry_of_Investment_Logo-white.svg';
import loginBottomLogo from '../../assets/Login-page-icon/MISA Investment Dynamo logo 2-.svg';
import { toastError, toastSuccess } from "../../common/toast";

import AnimatedLoginBackground from './AnimatedLoginBackground';
// Store
import { useDispatch, useSelector } from 'react-redux';
import { loginRequest, clearError } from '../../store/actions/authActions';
import {
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
  selectMustChangePassword,
} from '../../store/selectors/authSelectors';
import typography from "../../common/typography";
import { ENABLE_SSO, SSO_PROVIDER_LABEL } from "../../config/features";
import { markTourPending } from "../../tour/tourStorage";


// Validation functions with proper TypeScript types
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password: string): boolean => {
  // Login only requires a non-empty password; signup can enforce stronger rules.
  return password.trim().length >= 1;
};

// Keyframes animation for loading
const loadingAnimation = keyframes`
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
`;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [hasApiError, setHasApiError] = useState(false); // Track API errors
  const [sessionNotice, setSessionNotice] = useState("");

  // Redux selectors
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const mustChangePassword = useSelector(selectMustChangePassword);

  useEffect(() => {
    if (searchParams.get("session") === "expired") {
      setSessionNotice("Your session expired. Please sign in again.");
      toastError("Your session expired. Please sign in again.");
      const next = new URLSearchParams(searchParams);
      next.delete("session");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Check form validity whenever email or password changes
  useEffect(() => {
    const isEmailValid = Boolean(email) && isValidEmail(email) && !emailError;
    const isPasswordValid = Boolean(password) && isValidPassword(password) && !passwordError;
    setIsFormValid(isEmailValid && isPasswordValid);
  }, [email, password, emailError, passwordError]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (mustChangePassword) {
        toastSuccess("Please set a new password to continue.");
        navigate("/change-password", { replace: true });
        return;
      }
      toastSuccess("Login successful! Redirecting...");
      setShowSuccessToast(true);
      markTourPending();

      const timer = setTimeout(() => {
        navigate("/match-workbench");
      }, 500);

      return () => clearTimeout(timer);
    } else if (
      window.location.pathname !== "/" &&
      !window.location.pathname.startsWith("/forgot-password") &&
      !window.location.pathname.startsWith("/reset-password")
    ) {
      navigate("/");
    }
  }, [isAuthenticated, mustChangePassword, navigate]);

  // Show error toast when there's an authentication error
  useEffect(() => {
    if (error) {
      console.log(error, "error");

      setHasApiError(true); // Set API error flag
      toastError(error); // Show toast error


      // dispatch(clearError());
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5500);
      return () => clearTimeout(timer);
    } else {
      setHasApiError(false); // Reset API error flag when no error
    }
  }, [error, dispatch]);

  const validateEmail = (showToast = true): boolean => {
    if (!email) {
      setEmailError("Email is required");
      if (showToast) toastError("Email is required");
      return false;
    }

    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      if (showToast) toastError("Please enter a valid email address");
      return false;
    } else {
      setEmailError("");

      return true;
    }
  };

  const validatePassword = (showToast = true): boolean => {
    if (!password) {
      setPasswordError("Password is required");
      if (showToast) toastError("Password is required");
      return false;
    }

    if (!isValidPassword(password)) {
      setPasswordError("Password is required");
      if (showToast) toastError("Password is required");
      return false;
    } else {
      setPasswordError("");
      return true;
    }
  };

  const handleSubmit = (): void => {
    // Clear previous errors and API error flag
    setEmailError("");
    setPasswordError("");

    // Validate form before submission
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    if (isEmailValid && isPasswordValid) {
      dispatch(loginRequest(email, password));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <>
      <AnimatedLoginBackground />

      <LoginContainer>
        <LoginBox>
          <LogoParent>
            <LoginLogo src={loginLogo} alt="Login" />
          </LogoParent>
          <Title>Dynamo Intelligent Opportunity Matcher</Title>
          {/* <LogoText>AI-Powered Company-
            Opportunity Matchmaking</LogoText> */}

          <InputField>
            {/* <FieldLabel>Email</FieldLabel> */}
            <InputContainer>
              <UserInputIcon
                src={userIcon}
                alt="User icon"
              />
              <InputLine
                $hasError={!!emailError || hasApiError}
                $isValid={!emailError && !hasApiError && isValidEmail(email)}
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  onBlur={() => validateEmail(false)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
              </InputLine>
            </InputContainer>
            {emailError && !hasApiError && <ErrorText>{emailError}</ErrorText>}
          </InputField>

          <InputField>
            {/* <FieldLabel>Password</FieldLabel> */}
            <InputContainer>
              <InputIcon
                src={passwordIcon}
                alt="Password icon"
              />
              <InputLine
                $hasError={!!passwordError || hasApiError}
                $isValid={!passwordError && !hasApiError && isValidPassword(password)}
              >
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  onBlur={() => validatePassword(false)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <PasswordToggle
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  <img
                    src={showPassword ? eyeIcon : closeEye}
                    alt={showPassword ? "Hide password" : "Show password"}
                    style={{
                      width: "20px",
                      height: "20px",
                      filter: loading ? "brightness(0.3)" : "brightness(0.7)",
                      transition: "all 0.2s ease"
                    }}
                  />
                </PasswordToggle>
              </InputLine>
            </InputContainer>
            {passwordError && !hasApiError && <ErrorText>{passwordError}</ErrorText>}
          </InputField>

          {sessionNotice && <SessionNotice>{sessionNotice}</SessionNotice>}

          <Button
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            $isValid={isFormValid}
            $loading={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>

          <SsoDivider>
            <SsoDividerLine />
            <SsoDividerText>or</SsoDividerText>
            <SsoDividerLine />
          </SsoDivider>

          <SsoButton
            type="button"
            disabled={!ENABLE_SSO || loading}
            title={
              ENABLE_SSO
                ? `Continue with ${SSO_PROVIDER_LABEL}`
                : `${SSO_PROVIDER_LABEL} is not enabled for this environment`
            }
            onClick={() => {
              if (!ENABLE_SSO) return;
              toastError("SSO start is not fully configured yet.");
            }}
          >
            Continue with {SSO_PROVIDER_LABEL}
            {!ENABLE_SSO && <SsoBadge>Disabled</SsoBadge>}
          </SsoButton>

          <SecureText>Secure login - authorised officers only</SecureText>
          <FormOptionsContainer>
            <ForgotPasswordLink to="/forgot-password">
              Forgot password?
            </ForgotPasswordLink>
            <ToggleFormText>
              Need an account? Contact your administrator or{" "}
              <DisclaimerLink href="mailto:DBI@misa.gov.sa">
                DBI@misa.gov.sa
              </DisclaimerLink>
            </ToggleFormText>
          </FormOptionsContainer>

          <LogoParent>
            <BottomLogo src={loginBottomLogo} alt="MISA Logo" />
          </LogoParent>
          <LogoText>Powered by MISA Data Dynamo</LogoText>

          {/* Add this disclaimer below the toggle form text */}
          <DisclaimerText>
            Disclaimer: This platform is for authorised users only. For any information please contact{' '}
            <DisclaimerLink href="mailto:DBI@misa.gov.sa">DBI@misa.gov.sa</DisclaimerLink>
          </DisclaimerText>

        </LoginBox>
      </LoginContainer>
    </>
  );
};

export default LoginPage;

const SecureText = styled.p`
  text-align: center;
  color: #8a8f98;
  margin: 1.2rem 0 1.2rem 0;
  font-size: ${typography.pageTitleSmall.fontSize};
  font-weight: ${typography.pageTitleSmall.fontWeight};
  line-height: 1.4;
  padding: 0 1rem;
  opacity: 0.8;

  @media (min-width: 2560px) {
    margin: 2rem 0 2rem 0;
  }
`;
const DisclaimerText = styled.p`
  text-align: center;
  color: #8a8f98;
  margin: 0.5rem 0 0rem 0;
  font-size: ${typography.pageTitleSmall.fontSize};
  font-weight: ${typography.pageTitleSmall.fontWeight};
  line-height: 1.4;
  padding: 0 1rem;
  opacity: 0.8;

  @media (min-width: 2560px) {
    margin: 1rem 0 0rem 0;
  }
`;

const DisclaimerLink = styled.a`
  color: #00d084;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: #00b874;
    text-decoration: underline;
  }

  @media (min-width: 2560px) {
  }
`;

const FormOptionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 0;

  @media (min-width: 2560px) {
    margin: 1rem 0;
  }
`;

const ForgotPasswordLink = styled(Link)`
  color: rgba(232, 238, 245, 0.85);
  text-decoration: none;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  transition: color 0.2s ease;

  &:hover {
    color: #fff;
    text-decoration: underline;
  }
`;

// Existing styled components remain the same
const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;   
  width: 100%;     

  @media (min-width: 2560px) {
    
  }
`;


const LoginBox = styled.div`
  background: rgba(27, 31, 46, 0.95);
  padding:1.3rem 1.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  width: 500px;
  max-width: 90%;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin: 0 auto;

  @media (min-width: 2560px) {
    width: 700px;
    padding: 2.5rem 2.5rem;
    border-radius: 24px;
  }
`;

const InputField = styled.div`
  position: relative;
  margin:1rem 0 1.5rem 0;

  @media (min-width: 2560px) {
    margin: 1.5rem 0 2.5rem 0;
  }
`;

const InputContainer = styled.div`
  position: relative;
`;

const InputIcon = styled.img`
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  filter: brightness(0.7);
  transition: all 0.3s ease;
  z-index: 1;

  @media (min-width: 2560px) {
    width: 30px;
    height: 30px;
  }
`;

const UserInputIcon = styled.img`
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  filter: brightness(0.7);
  transition: all 0.3s ease;
  z-index: 1;

  @media (min-width: 2560px) {
    width: 30px;
    height: 30px;
  }
`;

const InputLine = styled.div<{ $hasError: boolean; $isValid: boolean }>`
  position: relative;
  margin-left: 2rem;

  @media (min-width: 2560px) {
    margin-left: 3rem;
  }
  
  &::after {
    content: "";
    position: absolute;
    left: -2rem;
    bottom: 0;
    width: calc(100% + 2rem);
    height: 1px;
    background: ${props => {
    if (props.$hasError) return '#ff4757';
    if (props.$isValid) return '#00d084';
    return '#3a4256';
  }};
    transition: all 0.3s ease;

    @media (min-width: 2560px) {
      left: -3rem;
      width: calc(100% + 3rem);
      height: 2px;
    }
  }
  
  &:focus-within::after {
    background: ${props => props.$hasError ? '#ff4757' : '#00d084'};
    height: 2px;
    box-shadow: ${props => props.$hasError
    ? '0 2px 8px rgba(255, 71, 87, 0.3)'
    : '0 2px 8px rgba(0, 208, 132, 0.3)'};

    @media (min-width: 2560px) {
      height: 3px;
    }
  }
`;

const Input = styled.input`
  width: 100%;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  padding: 0.75rem 0;
  background: transparent;
  border: none;
  outline: none;
  color: #f0f4ff;
  letter-spacing: 0.5px;
  
  &::placeholder {
    color: #6b7280;
    opacity: 1;
    transition: all 0.3s ease;
  }
  
  &:focus::placeholder {
    color: #00d084;
    opacity: 0.7;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-background-clip: text;
    -webkit-text-fill-color: #f0f4ff;
    transition: background-color 5000s ease-in-out 0s;
    box-shadow: inset 0 0 20px 20px transparent;
  }

  @media (min-width: 2560px) {
    padding: 1.25rem 0;
  }
`;

const FieldLabel = styled.div`
  color: #c2c7cc;
  font-size: 1.2rem;
  margin-bottom: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.3px;

  @media (min-width: 2560px) {
    margin-bottom: 1.2rem;
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;

  &:hover {
    transform: translateY(-50%) scale(1.1);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    
    &:hover {
      transform: translateY(-50%);
    }
  }

  img {
    width: 20px;
    height: 20px;
    filter: brightness(0.7);
    transition: all 0.2s ease;
  }

  &:hover img {
    filter: brightness(1) sepia(1) hue-rotate(100deg) saturate(5);
  }

  @media (min-width: 2560px) {
    padding: 0 1rem;
    
    img {
      width: 30px;
      height: 30px;
    }
  }
`;

const SessionNotice = styled.div`
  width: 100%;
  box-sizing: border-box;
  margin: 0 0 0.75rem;
  padding: 0.7rem 0.85rem;
  border-radius: 8px;
  border: 1px solid rgba(245, 158, 11, 0.4);
  background: rgba(245, 158, 11, 0.1);
  color: #fcd34d;
  font-size: ${typography.paragraph.fontSize};
  font-weight: ${typography.paragraph.fontWeight};
  line-height: 1.4;
`;

const SsoDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  margin: 1rem 0 0.85rem;
`;

const SsoDividerLine = styled.div`
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
`;

const SsoDividerText = styled.span`
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const SsoButton = styled.button`
  width: 100%;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.85);
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover:not(:disabled) {
    border-color: rgba(0, 200, 140, 0.45);
    background: rgba(0, 255, 136, 0.06);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const SsoBadge = styled.span`
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.15rem 0.4rem;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.55);
`;

const Button = styled.button<{ $isValid: boolean; $loading: boolean }>`
  width: 100%;
  padding: 1.1rem;
  background: ${props => {
    if (props.$loading) return 'linear-gradient(90deg, #4a5568 0%, #2d3748 100%)';
    return props.$isValid
      ? 'linear-gradient(90deg, #00d084 0%, #00b874 100%)'
      : 'linear-gradient(90deg, #4a5568 0%, #2d3748 100%)';
  }};
  border: none;
  border-radius: 10px;
  color: ${props => props.$loading ? '#6b7280' : '#0d0f1a'};
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  cursor: ${props => (props.$isValid && !props.$loading) ? 'pointer' : 'not-allowed'};
  transition: all 0.3s ease;
  margin-top: 0.5rem;
  letter-spacing: 0.5px;
  box-shadow: ${props => (props.$isValid && !props.$loading)
    ? '0 4px 15px rgba(0, 208, 132, 0.3)'
    : 'none'};
  position: relative;
  overflow: hidden;

  &:hover {
    transform: ${props => (props.$isValid && !props.$loading) ? 'translateY(-2px)' : 'none'};
    box-shadow: ${props => (props.$isValid && !props.$loading)
    ? '0 6px 20px rgba(0, 208, 132, 0.4)'
    : 'none'};
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: linear-gradient(90deg, #4a5568 0%, #2d3748 100%);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    color:white;
  }

  // Loading animation
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    animation: ${props => props.$loading ? loadingAnimation : 'none'} 1.5s infinite;
  }

  @media (min-width: 2560px) {
    padding: 1.8rem;
    border-radius: 15px;
    margin-top: 1rem;
  }
`;

const LoginLogo = styled.img`
  width: 160px;
  margin-top: 0rem;
  margin-bottom: 1rem;

  @media (min-width: 2560px) {
    width: 240px;
    margin-bottom: 2rem;
  }
`;

const Title = styled.p`
  color: #fff;
  font-size: ${typography.datasHeading.fontSize};
  font-weight: ${typography.datasHeading.fontWeight};
  text-align: center;
  margin: 0rem 0 2rem 0;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  @media (min-width: 2560px) {
    margin: 0rem 0 3rem 0;
  }
`;

const BottomLogo = styled.img`
  width: 160px;
  object-fit: contain;
  margin-bottom:1rem;
  @media (min-width: 2560px) {
    width: 240px;
  }
`;

const LogoParent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LogoText = styled.p`
   text-align: center;
   font-size: ${typography.pageTitleSmall.fontSize};
   font-weight: ${typography.pageTitleSmall.fontWeight};
   color: #c2c7cc;
   margin: 0 0 0rem 0;

   @media (min-width: 2560px) {
    margin:  0;
  }
`;

const ErrorText = styled.div`
  color: #ff4757;
  font-size: ${typography.pageTitleSmall.fontSize};
  font-weight: ${typography.pageTitleSmall.fontWeight};
  margin-top: 0.5rem;
  padding-left: 0.5rem;

  @media (min-width: 2560px) {
    margin-top: 1rem;
  }
`;

// New components for signup option
const ToggleFormText = styled.p`
  color: #c2c7cc;
  margin: 0;
  font-size: ${typography.pageTitleSmall.fontSize};
  font-weight: ${typography.pageTitleSmall.fontWeight};
`;

const ToggleFormButton = styled.button`
  background: transparent;
  border: none;
  color: #00d084;
  cursor: pointer;
  text-decoration: underline;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  
  &:hover {
    color: #00b874;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
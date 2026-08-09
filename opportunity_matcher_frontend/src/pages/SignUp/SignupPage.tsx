import React, { useState } from "react";
import styled from "styled-components";
import eyeIcon from "../../assets/eye.svg";
import userIcon from "../../assets/LeadingIcon.svg";
import passwordIcon from "../../assets/passwordlock.svg";
import closeEye from "../../assets/eye-slash.svg";
import { useNavigate, Link } from "react-router-dom";
import { toastError, toastSuccess } from "../../common/toast";
import AnimatedLoginBackground from "../Login/AnimatedLoginBackground";
import typography from "../../common/typography";

// Validation functions with proper TypeScript types
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password: string): boolean => {
  // At least 6 characters total
  if (password.length < 6) return false;
  
  // Check for at least 1 special character
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  // Check for at least 1 uppercase letter
  const hasUppercase = /[A-Z]/.test(password);
  
  return hasSpecialChar && hasUppercase;
};

const isValidName = (name: string): boolean => {
  return name.trim().length >= 2;
};

const SignupPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  
  const navigate = useNavigate();

  // Check form validity whenever name, email or password changes
  React.useEffect(() => {
    const isNameValid = Boolean(name) && isValidName(name) && !nameError;
    const isEmailValid = Boolean(email) && isValidEmail(email) && !emailError;
    const isPasswordValid = Boolean(password) && isValidPassword(password) && !passwordError;
    const isConfirmPasswordValid = Boolean(confirmPassword) && password === confirmPassword && !confirmPasswordError;
    setIsFormValid(isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid);
  }, [name, email, password, confirmPassword, nameError, emailError, passwordError, confirmPasswordError]);

  const validateName = (): void => {
    if (!name) {
      setNameError("");
      return;
    }

    if (!isValidName(name)) {
      setNameError("Name must be at least 2 characters long");
    } else {
      setNameError("");
    }
  };

  const validateEmail = (): void => {
    if (!email) {
      setEmailError("");
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const validatePassword = (): void => {
    if (!password) {
      setPasswordError("");
      return;
    }

    if (!isValidPassword(password)) {
      setPasswordError("Password must be 6 characters with 1 special character & 1 uppercase letter");
    } else {
      setPasswordError("");
    }
  };

  const validateConfirmPassword = (): void => {
    if (!confirmPassword) {
      setConfirmPasswordError("");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  };

  const handleSubmit = (): void => {
    // Clear previous errors
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    // Validate form before submission
    validateName();
    validateEmail();
    validatePassword();
    validateConfirmPassword();

    if (isFormValid) {
      // Handle signup logic here
      console.log("Signup submitted:", { name, email, password });
      
      // Show success toast
      toastSuccess("Signup successful! Redirecting...");
      
      // Navigate after successful signup with a slight delay to show the toast
      setTimeout(() => {
        navigate("/portfolio");
      }, 2000);
    } else {
      // Show validation errors if form is not valid
      if (!name) {
        setNameError("Name is required");
        toastError("Name is required");
      }
      if (!email) {
        setEmailError("Email is required");
        toastError("Email is required");
      } else if (!isValidEmail(email)) {
        toastError("Please enter a valid email address");
      }
      if (!password) {
        setPasswordError("Password is required");
        toastError("Password is required");
      } else if (!isValidPassword(password)) {
        toastError("Password must be 6 characters with 1 special character & 1 uppercase letter");
      }
      if (!confirmPassword) {
        setConfirmPasswordError("Please confirm your password");
        toastError("Confirm Password is required");
      } else if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match");
        toastError("Passwords do not match");
      }
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

      <SignupContainer>
        <SignupBox>
          <Title>Create Account</Title>
          

          <InputField>
            <FieldLabel>Name</FieldLabel>
            <InputContainer>
              <UserInputIcon
                src={userIcon}
                alt="User icon"
              />
              <InputLine>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError("");
                  }}
                  onBlur={validateName}
                  onKeyPress={handleKeyPress}
                />
              </InputLine>
            </InputContainer>
            {nameError && <ErrorText>{nameError}</ErrorText>}
          </InputField>

          <InputField>
            <FieldLabel>Email</FieldLabel>
            <InputContainer>
              <UserInputIcon
                src={userIcon}
                alt="User icon"
              />
              <InputLine>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  onBlur={validateEmail}
                  onKeyPress={handleKeyPress}
                />
              </InputLine>
            </InputContainer>
            {emailError && <ErrorText>{emailError}</ErrorText>}
          </InputField>

          <InputField>
            <FieldLabel>Password</FieldLabel>
            <InputContainer>
              <InputIcon
                src={passwordIcon}
                alt="Password icon"
              />
              <InputLine>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  onBlur={validatePassword}
                  onKeyPress={handleKeyPress}
                />
                <PasswordToggle
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <img
                    src={showPassword ? eyeIcon : closeEye}
                    alt={showPassword ? "Hide password" : "Show password"}
                    style={{
                      width: "20px",
                      height: "20px",
                      filter: "brightness(0.7)",
                      transition: "all 0.2s ease"
                    }}
                  />
                </PasswordToggle>
              </InputLine>
            </InputContainer>
            {passwordError && <ErrorText>{passwordError}</ErrorText>}
          </InputField>

          <InputField>
            <FieldLabel>Confirm Password</FieldLabel>
            <InputContainer>
              <InputIcon
                src={passwordIcon}
                alt="Password icon"
              />
              <InputLine>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordError("");
                  }}
                  onBlur={validateConfirmPassword}
                  onKeyPress={handleKeyPress}
                />
                <PasswordToggle
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <img
                    src={showConfirmPassword ? eyeIcon : closeEye}
                    alt={showConfirmPassword ? "Hide password" : "Show password"}
                    style={{
                      width: "20px",
                      height: "20px",
                      filter: "brightness(0.7)",
                      transition: "all 0.2s ease"
                    }}
                  />
                </PasswordToggle>
              </InputLine>
            </InputContainer>
            {confirmPasswordError && <ErrorText>{confirmPasswordError}</ErrorText>}
          </InputField>

          <Button
            onClick={handleSubmit}
            disabled={!isFormValid}
            $isValid={isFormValid}
          >
            Submit
          </Button>

          <LoginLink>
            Already have an account? <LoginLinkText to="/login">Login</LoginLinkText>
          </LoginLink>
          
        </SignupBox>
      </SignupContainer>
    </>
  );
};

export default SignupPage;

// Styled Components
const SignupContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh; // This ensures the container takes full viewport height
  width: 100%;
`;
const SignupBox = styled.div`
  background: rgba(27, 31, 46, 0.95);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  width: 500px;
  max-width: 90%;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const InputField = styled.div`
  position: relative;
  margin-bottom: 2.5rem; // Increased to accommodate error messages
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
`;

const InputLine = styled.div`
  position: relative;
  margin-left: 2rem;
  
  &::after {
    content: "";
    position: absolute;
    left: -2rem;
    bottom: 0;
    width: calc(100% + 2rem);
    height: 1px;
    background: #3a4256;
    transition: all 0.3s ease;
  }
  
  &:focus-within::after {
    background: #00d084;
    height: 2px;
    box-shadow: 0 2px 8px rgba(0, 208, 132, 0.3);
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 0;
  background: transparent;
  border: none;
  outline: none;
  color: #f0f4ff;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
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
  
  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-background-clip: text;
    -webkit-text-fill-color: #f0f4ff;
    transition: background-color 5000s ease-in-out 0s;
    box-shadow: inset 0 0 20px 20px transparent;
  }
`;

const FieldLabel = styled.div`
  color: #c2c7cc;
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  margin-bottom: 0.7rem;
  letter-spacing: 0.3px;
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

  img {
    width: 20px;
    height: 20px;
    filter: brightness(0.7);
    transition: all 0.2s ease;
  }

  &:hover img {
    filter: brightness(1) sepia(1) hue-rotate(100deg) saturate(5);
  }
`;

const Button = styled.button<{ $isValid: boolean }>`
  width: 100%;
  padding: 1.1rem;
  background: ${props => props.$isValid
    ? 'linear-gradient(90deg, #00d084 0%, #00b874 100%)'
    : 'linear-gradient(90deg, #4a5568 0%, #2d3748 100%)'};
  border: none;
  border-radius: 10px;
  color: #0d0f1a;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  cursor: ${props => props.$isValid ? 'pointer' : 'not-allowed'};
  transition: all 0.3s ease;
  margin-top: 0.5rem;
  letter-spacing: 0.5px;
  box-shadow: ${props => props.$isValid
    ? '0 4px 15px rgba(0, 208, 132, 0.3)'
    : 'none'};

  &:hover {
    transform: ${props => props.$isValid ? 'translateY(-2px)' : 'none'};
    box-shadow: ${props => props.$isValid
    ? '0 6px 20px rgba(0, 208, 132, 0.4)'
    : 'none'};
  }

  &:active {
    transform: translateY(0);
  }
`;

const Title = styled.p`
  color: #fff;
  text-align: center;
  margin: 0 0 0.5rem 0;
  font-weight: 400;
  letter-spacing: 0.5px;
  font-size: ${typography.datasHeading.fontSize};
  font-weight: ${typography.datasHeading.fontWeight};
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const ErrorText = styled.div`
  color: #ff4757;
  font-size: ${typography.pageTitleSmall.fontSize};
  font-weight: ${typography.pageTitleSmall.fontWeight};
  margin-top: 0.5rem;
  padding-left: 2rem;
  position: relative; // Changed from absolute to relative
  bottom: 0;
  left: 0;
`;

const LoginLink = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  color: #c2c7cc;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
`;

const LoginLinkText = styled(Link)`
  color: #00d084;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    color: #00b874;
    text-decoration: underline;
  }
`;
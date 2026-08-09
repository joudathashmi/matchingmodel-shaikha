import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import AnimatedLoginBackground from "../Login/AnimatedLoginBackground";
import loginLogo from "../../assets/Login-page-icon/Ministry_of_Investment_Logo-white.svg";

/**
 * Self-service email reset is not enabled. Officers are directed to an admin.
 */
const ForgotPasswordPage: React.FC = () => {
  return (
    <>
      <AnimatedLoginBackground />
      <Wrap>
        <Card>
          <Logo src={loginLogo} alt="Ministry of Investment" />
          <Title>Password help</Title>
          <Lead>
            Self-service password reset is not available yet. Ask a desk
            administrator to set a temporary password for your account, or
            contact{" "}
            <Mail href="mailto:DBI@misa.gov.sa">DBI@misa.gov.sa</Mail>.
          </Lead>
          <Steps>
            <li>Sign in is limited to accounts created by an administrator.</li>
            <li>
              An admin can reset your password under Settings → Users, then you
              set a new one on first sign-in.
            </li>
          </Steps>
          <Back to="/">Back to sign in</Back>
        </Card>
      </Wrap>
    </>
  );
};

export default ForgotPasswordPage;

const Wrap = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  position: relative;
  z-index: 1;
`;

const Card = styled.div`
  width: min(420px, 100%);
  background: rgba(12, 16, 28, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 1.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const Logo = styled.img`
  height: 42px;
  width: auto;
  align-self: flex-start;
  margin-bottom: 0.35rem;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.25rem;
  color: #fff;
`;

const Lead = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.72);
`;

const Mail = styled.a`
  color: #00d084;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
`;

const Steps = styled.ul`
  margin: 0;
  padding-left: 1.15rem;
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.82rem;
  line-height: 1.5;

  li + li {
    margin-top: 0.4rem;
  }
`;

const Back = styled(Link)`
  margin-top: 0.35rem;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.85rem;
  text-align: center;
`;

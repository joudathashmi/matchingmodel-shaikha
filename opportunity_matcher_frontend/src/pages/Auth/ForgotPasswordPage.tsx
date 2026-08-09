import React, { useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../store/services/authService";
import { toastError, toastSuccess } from "../../common/toast";
import AnimatedLoginBackground from "../Login/AnimatedLoginBackground";
import loginLogo from "../../assets/Login-page-icon/Ministry_of_Investment_Logo-white.svg";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !email.includes("@")) {
      toastError("Enter a valid email address");
      return;
    }
    setBusy(true);
    setResetUrl(null);
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      toastSuccess(res.message);
      if (res.resetUrl) setResetUrl(res.resetUrl);
    } catch (e: any) {
      toastError(e?.response?.data?.message || e?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AnimatedLoginBackground />
      <Wrap>
        <Card>
          <Logo src={loginLogo} alt="Ministry of Investment" />
          <Title>Reset your password</Title>
          <Lead>
            Enter the email for your officer account. If it exists, a reset link
            will be issued. Accounts are created by an administrator only.
          </Lead>
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@misa.gov.sa"
            onKeyDown={(e) => e.key === "Enter" && void submit()}
          />
          <Primary type="button" disabled={busy} onClick={() => void submit()}>
            {busy ? "Sending…" : "Send reset link"}
          </Primary>
          {resetUrl ? (
            <DevBox>
              <strong>Development reset link</strong>
              <a href={resetUrl}>{resetUrl}</a>
            </DevBox>
          ) : null}
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
  gap: 0.75rem;
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
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.65);
`;

const Label = styled.label`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
`;

const Input = styled.input`
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border-radius: 8px;
  padding: 0.7rem 0.85rem;
  font-size: 0.9rem;
`;

const Primary = styled.button`
  margin-top: 0.35rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 8px;
  padding: 0.7rem 1rem;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

const DevBox = styled.div`
  margin-top: 0.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(230, 190, 80, 0.1);
  border: 1px solid rgba(230, 190, 80, 0.35);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  word-break: break-all;
  a {
    color: #f0d78a;
  }
`;

const Back = styled(Link)`
  margin-top: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  text-align: center;
`;

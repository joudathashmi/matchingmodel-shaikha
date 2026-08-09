import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../store/services/authService";
import { toastError, toastSuccess } from "../../common/toast";
import AnimatedLoginBackground from "../Login/AnimatedLoginBackground";
import loginLogo from "../../assets/Login-page-icon/Ministry_of_Investment_Logo-white.svg";

const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!token) {
      toastError("Missing reset token. Use the link from your reset email.");
      return;
    }
    if (password.length < 8) {
      toastError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toastError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const res = await resetPassword(token, password);
      toastSuccess(res.message);
      navigate("/", { replace: true });
    } catch (e: any) {
      toastError(e?.response?.data?.message || e?.message || "Reset failed");
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
          <Title>Choose a new password</Title>
          <Lead>Set a password you will use for this officer desk.</Lead>
          {!token ? (
            <Warn>
              This link is missing a token. Request a new reset from{" "}
              <Link to="/forgot-password">Forgot password</Link>.
            </Warn>
          ) : null}
          <Label>New password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
          <Label>Confirm password</Label>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
          />
          <Primary type="button" disabled={busy || !token} onClick={() => void submit()}>
            {busy ? "Saving…" : "Update password"}
          </Primary>
          <Back to="/">Back to sign in</Back>
        </Card>
      </Wrap>
    </>
  );
};

export default ResetPasswordPage;

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
  gap: 0.7rem;
`;

const Logo = styled.img`
  height: 42px;
  width: auto;
  align-self: flex-start;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.25rem;
  color: #fff;
`;

const Lead = styled.p`
  margin: 0 0 0.35rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.65);
`;

const Warn = styled.div`
  font-size: 0.8rem;
  color: #ffb4a8;
  a {
    color: #f0d78a;
  }
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

const Back = styled(Link)`
  margin-top: 0.35rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  text-align: center;
`;

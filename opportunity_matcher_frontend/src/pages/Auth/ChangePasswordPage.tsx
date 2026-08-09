import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { changePassword } from "../../store/services/authService";
import { passwordChanged } from "../../store/actions/authActions";
import { selectMustChangePassword } from "../../store/selectors/authSelectors";
import { toastError, toastSuccess } from "../../common/toast";
import AnimatedLoginBackground from "../Login/AnimatedLoginBackground";
import loginLogo from "../../assets/Login-page-icon/Ministry_of_Investment_Logo-white.svg";

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const forced = useSelector(selectMustChangePassword);
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (newPassword.length < 8) {
      toastError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirm) {
      toastError("Passwords do not match");
      return;
    }
    if (newPassword === currentPassword) {
      toastError("New password must be different from the temporary password");
      return;
    }
    setBusy(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      dispatch(passwordChanged());
      toastSuccess(res.message || "Password updated");
      navigate("/portfolio", { replace: true });
    } catch (e: any) {
      toastError(
        e?.response?.data?.message || e?.message || "Could not update password"
      );
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
          <Title>
            {forced ? "Set your password" : "Change password"}
          </Title>
          <Lead>
            {forced
              ? "Your administrator issued a temporary password. Choose a new one before using the desk."
              : "Update the password for your officer account."}
          </Lead>
          <Label>Current password</Label>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Temporary password from admin"
          />
          <Label>New password</Label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNew(e.target.value)}
            placeholder="At least 8 characters"
          />
          <Label>Confirm new password</Label>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
          />
          <Primary type="button" disabled={busy} onClick={() => void submit()}>
            {busy ? "Saving…" : "Save and continue"}
          </Primary>
        </Card>
      </Wrap>
    </>
  );
};

export default ChangePasswordPage;

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

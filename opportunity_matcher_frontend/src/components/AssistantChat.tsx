import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import styled, { keyframes } from "styled-components";
import axiosClient from "../api/axiosClient";
import { selectIsAuthenticated } from "../store/selectors/authSelectors";
import chatBotIcon from "../assets/icons/chat-bot.svg";

type Role = "user" | "assistant";

type ChatAction = {
  type: string;
  label: string;
  href: string;
  subtitle?: string;
  matchId?: number;
  companyId?: number;
  opportunityId?: number;
};

type Msg = {
  id: string;
  role: Role;
  content: string;
  actions?: ChatAction[];
};

function matchIdFromPath(pathname: string): number | null {
  const m = pathname.match(/^\/matches\/(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function pageLabel(pathname: string): string {
  if (pathname.startsWith("/matches/")) return "match_case";
  if (pathname.startsWith("/pursuit")) return "pursuit";
  if (pathname.startsWith("/match-workbench")) return "match_workbench";
  if (pathname.startsWith("/portfolio")) return "portfolio";
  if (pathname.startsWith("/explore")) return "explore";
  return pathname.replace(/^\//, "") || "app";
}

function renderLightMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

const SUGGESTIONS = [
  "Show top Excellent matches",
  "Companies in Healthcare",
  "Investment opportunities in Pharma",
  "Matches for EastPharma",
];

const AssistantChat: React.FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Ask about companies, investment opportunities, or matches. I’ll pull live data and give you buttons to open the Match Case.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const matchId = matchIdFromPath(location.pathname);
  const page = pageLabel(location.pathname);
  const hideOnLogin =
    location.pathname === "/" ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/sso");

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, sending]);

  if (!isAuthenticated || hideOnLogin) return null;

  const openAction = (action: ChatAction) => {
    if (!action.href) return;
    setOpen(false);
    navigate(action.href);
  };

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || sending) return;

    const userMsg: Msg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const { data } = await axiosClient.post("/ai-data/chat", {
        message: text,
        matchId,
        page,
        history,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.reply || "No response.",
          actions: Array.isArray(data.actions) ? data.actions : [],
        },
      ]);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not reach the assistant");
    } finally {
      setSending(false);
    }
  };

  const ui = (
    <Root>
      {open && (
        <Panel role="dialog" aria-label="AI Matchmaking Engine">
          <Head>
            <Brand>
              <IconBadge aria-hidden>
                <HeadIcon src={chatBotIcon} alt="" />
              </IconBadge>
              <HeadTitle>Match desk</HeadTitle>
            </Brand>
            {matchId ? <HeadMeta>Match #{matchId}</HeadMeta> : null}
            <CloseBtn type="button" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </CloseBtn>
          </Head>

          <Thread>
            {messages.map((m) => (
              <MsgBlock key={m.id} $role={m.role}>
                <Bubble $role={m.role}>
                  {renderLightMarkdown(m.content)}
                </Bubble>
                {m.role === "assistant" && m.actions && m.actions.length > 0 && (
                  <ActionStack>
                    {m.actions.map((a, i) => (
                      <ActionBtn
                        key={`${m.id}-${a.href}-${i}`}
                        type="button"
                        onClick={() => openAction(a)}
                      >
                        <ActionLabel>{a.label}</ActionLabel>
                        {a.subtitle && (
                          <ActionSub>{a.subtitle}</ActionSub>
                        )}
                      </ActionBtn>
                    ))}
                  </ActionStack>
                )}
              </MsgBlock>
            ))}
            {sending && <Typing>Looking up companies & opportunities…</Typing>}
            {error && <Err>{error}</Err>}
            <div ref={bottomRef} />
          </Thread>

          {messages.length <= 1 && (
            <SuggestRow>
              {SUGGESTIONS.map((s) => (
                <Chip key={s} type="button" onClick={() => void send(s)}>
                  {s}
                </Chip>
              ))}
            </SuggestRow>
          )}

          <Composer
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <Field
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                matchId
                  ? "Ask about this company or opportunity…"
                  : "e.g. companies in Healthcare…"
              }
              rows={2}
              maxLength={2000}
              disabled={sending}
            />
            <SendBtn type="submit" disabled={sending || !input.trim()}>
              Send
            </SendBtn>
          </Composer>
        </Panel>
      )}

      <Fab
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close match desk" : "Open match desk"}
        $open={open}
      >
        <FabIcon src={chatBotIcon} alt="" />
        {!open && <FabLabel>Ask</FabLabel>}
      </Fab>
    </Root>
  );

  return createPortal(ui, document.body);
};

export default AssistantChat;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Root = styled.div`
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  left: auto;
  top: auto;
  z-index: 10050;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.65rem;
  font-family: "DM Sans", sans-serif;
  pointer-events: none;
  width: max-content;
  max-width: calc(100vw - 1.5rem);

  & > * {
    pointer-events: auto;
  }

  @media (max-width: 640px) {
    right: 0.75rem;
    bottom: 0.75rem;
    max-width: calc(100vw - 1.5rem);
  }
`;

const Fab = styled.button<{ $open?: boolean }>`
  appearance: none;
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  padding: ${(p) => (p.$open ? "0.6rem" : "0.55rem 0.95rem 0.55rem 0.7rem")};
  cursor: pointer;
  background: #141a28;
  color: #e8eef5;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.32);
  transition: border-color 0.15s ease, background 0.15s ease;
  flex-shrink: 0;

  &:hover {
    border-color: rgba(255, 255, 255, 0.28);
    background: #1a2234;
  }
`;

const IconBadge = styled.span<{ $fab?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 ${(p) => (p.$fab ? "36px" : "28px")};
  width: ${(p) => (p.$fab ? "36px" : "28px")};
  height: ${(p) => (p.$fab ? "36px" : "28px")};
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
`;

const FabIcon = styled.img`
  width: 18px;
  height: 18px;
  min-width: 18px;
  min-height: 18px;
  object-fit: contain;
  display: block;
  flex-shrink: 0;
`;

const FabLabel = styled.span`
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
`;

const Panel = styled.div`
  width: min(400px, calc(100vw - 1.5rem));
  height: min(620px, calc(100vh - 5.5rem));
  max-height: min(620px, calc(100vh - 5.5rem));
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #101624;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45);
  animation: ${fadeUp} 0.18s ease;
  overflow: hidden;
  align-self: flex-end;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
`;

const HeadTitle = styled.div`
  font-size: 0.82rem;
  font-weight: 700;
  color: #f2fff8;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HeadIcon = styled.img`
  width: 16px;
  height: 16px;
  min-width: 16px;
  min-height: 16px;
  object-fit: contain;
  display: block;
  flex-shrink: 0;
`;

const HeadMeta = styled.span`
  font-size: 0.68rem;
  color: rgba(158, 240, 200, 0.85);
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
`;

const CloseBtn = styled.button`
  appearance: none;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.15rem;
  flex-shrink: 0;

  &:hover {
    color: #fff;
  }
`;

const Thread = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-height: 0;
`;

const MsgBlock = styled.div<{ $role: Role }>`
  align-self: ${(p) => (p.$role === "user" ? "flex-end" : "flex-start")};
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-width: 96%;
  width: ${(p) => (p.$role === "assistant" ? "96%" : "auto")};
`;

const Bubble = styled.div<{ $role: Role }>`
  align-self: stretch;
  padding: 0.55rem 0.7rem;
  border-radius: 10px;
  font-size: 0.78rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  background: ${(p) =>
    p.$role === "user"
      ? "linear-gradient(135deg, rgba(0, 255, 136, 0.18), rgba(0, 180, 216, 0.16))"
      : "rgba(255, 255, 255, 0.05)"};
  border: 1px solid
    ${(p) =>
      p.$role === "user"
        ? "rgba(158, 240, 200, 0.28)"
        : "rgba(255, 255, 255, 0.08)"};
  color: rgba(255, 255, 255, 0.9);
`;

const ActionStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const ActionBtn = styled.button`
  appearance: none;
  width: 100%;
  text-align: left;
  border-radius: 8px;
  border: 1px solid rgba(158, 240, 200, 0.28);
  background: rgba(0, 255, 136, 0.06);
  padding: 0.5rem 0.65rem;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    border-color: rgba(158, 240, 200, 0.55);
    background: rgba(0, 255, 136, 0.12);
  }
`;

const ActionLabel = styled.div`
  font-size: 0.76rem;
  font-weight: 700;
  color: #e8fff4;
`;

const ActionSub = styled.div`
  margin-top: 0.15rem;
  font-size: 0.68rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.48);
  line-height: 1.3;
`;

const Typing = styled.div`
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.45);
  padding-left: 0.2rem;
`;

const Err = styled.div`
  font-size: 0.72rem;
  color: #ffb4a8;
`;

const SuggestRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding: 0 0.85rem 0.55rem;
`;

const Chip = styled.button`
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  padding: 0.28rem 0.55rem;
  font-size: 0.68rem;
  cursor: pointer;
  font-family: inherit;
  text-align: left;

  &:hover {
    border-color: rgba(158, 240, 200, 0.35);
    color: #e8fff4;
  }
`;

const Composer = styled.form`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.45rem;
  padding: 0.7rem 0.85rem 0.85rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const Field = styled.textarea`
  resize: none;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.28);
  color: rgba(255, 255, 255, 0.92);
  padding: 0.5rem 0.6rem;
  font-family: inherit;
  font-size: 0.78rem;
  line-height: 1.4;

  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }

  &:focus {
    outline: none;
    border-color: rgba(0, 200, 140, 0.45);
  }
`;

const SendBtn = styled.button`
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0 0.85rem;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.92);
  align-self: end;
  height: 2.4rem;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.14);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

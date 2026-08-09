import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axiosClient from "../../api/axiosClient";
import { useSelector } from "react-redux";
import { selectUserRole } from "../../store/selectors/getUserRoleSelectors";

export type MatchComment = {
  id: string;
  matchId: number;
  body: string;
  createdAt: string;
  author: { id: string; name: string | null; email: string };
};

type Props = {
  matchId: number;
  comments: MatchComment[];
  onCommentsChange: (matchId: number, next: MatchComment[]) => void;
};

function authorLabel(c: MatchComment) {
  return c.author.name?.trim() || c.author.email.split("@")[0] || "Officer";
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

const PursuitNotes: React.FC<Props> = ({
  matchId,
  comments,
  onCommentsChange,
}) => {
  const me = useSelector(selectUserRole);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [matchId, open]);

  const submit = async () => {
    const body = draft.trim();
    if (!body || saving) return;
    try {
      setSaving(true);
      setError(null);
      const { data } = await axiosClient.post("/match-comments", {
        matchId,
        body,
      });
      const created = data.comment as MatchComment;
      onCommentsChange(matchId, [...comments, created]);
      setDraft("");
      setOpen(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not save note");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (commentId: string) => {
    try {
      await axiosClient.delete(`/match-comments/${commentId}`);
      onCommentsChange(
        matchId,
        comments.filter((c) => c.id !== commentId)
      );
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not delete note");
    }
  };

  return (
    <Wrap>
      <Toggle type="button" onClick={() => setOpen((v) => !v)}>
        <span>Notes / references</span>
        <Meta>
          {comments.length > 0 ? `${comments.length}` : "Add"}
          <Chevron $open={open}>▾</Chevron>
        </Meta>
      </Toggle>

      {open && (
        <Panel>
          {comments.length === 0 && (
            <Empty>No notes yet. Add a reference for the team.</Empty>
          )}
          {comments.map((c) => (
            <Note key={c.id}>
              <NoteHead>
                <Author>{authorLabel(c)}</Author>
                <When>{formatWhen(c.createdAt)}</When>
                {(me?.id === c.author.id ||
                  me?.roles?.includes("admin")) && (
                  <DeleteBtn type="button" onClick={() => remove(c.id)}>
                    Remove
                  </DeleteBtn>
                )}
              </NoteHead>
              <NoteBody>{c.body}</NoteBody>
            </Note>
          ))}

          <Composer>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a note or reference…"
              rows={2}
              maxLength={2000}
              disabled={saving}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  void submit();
                }
              }}
            />
            <ComposerRow>
              {error && <Err>{error}</Err>}
              <AddBtn
                type="button"
                disabled={saving || !draft.trim()}
                onClick={() => void submit()}
              >
                {saving ? "Saving…" : "Add note"}
              </AddBtn>
            </ComposerRow>
          </Composer>
        </Panel>
      )}
    </Wrap>
  );
};

export default PursuitNotes;

const Wrap = styled.div`
  margin-top: 0.55rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 0.45rem;
`;

const Toggle = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  background: none;
  border: none;
  padding: 0.15rem 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);

  &:hover {
    color: rgba(255, 255, 255, 0.75);
  }
`;

const Meta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-variant-numeric: tabular-nums;
  color: rgba(158, 240, 200, 0.85);
`;

const Chevron = styled.span<{ $open?: boolean }>`
  display: inline-block;
  transform: ${(p) => (p.$open ? "rotate(180deg)" : "none")};
  transition: transform 0.15s ease;
  color: rgba(255, 255, 255, 0.4);
`;

const Panel = styled.div`
  margin-top: 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const Empty = styled.div`
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.38);
  line-height: 1.4;
`;

const Note = styled.div`
  padding: 0.45rem 0.5rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const NoteHead = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
  margin-bottom: 0.25rem;
`;

const Author = styled.span`
  font-size: 0.68rem;
  font-weight: 600;
  color: rgba(158, 240, 200, 0.9);
`;

const When = styled.span`
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.35);
`;

const DeleteBtn = styled.button`
  margin-left: auto;
  background: none;
  border: none;
  padding: 0;
  font-size: 0.65rem;
  color: rgba(255, 180, 168, 0.85);
  cursor: pointer;
  font-family: inherit;

  &:hover {
    color: #ffb4a8;
  }
`;

const NoteBody = styled.p`
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.78);
  white-space: pre-wrap;
  word-break: break-word;
`;

const Composer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const Input = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  min-height: 52px;
  max-height: 120px;
  padding: 0.45rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.28);
  color: rgba(255, 255, 255, 0.9);
  font-family: inherit;
  font-size: 0.75rem;
  line-height: 1.4;

  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }

  &:focus {
    outline: none;
    border-color: rgba(0, 200, 140, 0.45);
  }
`;

const ComposerRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const Err = styled.span`
  margin-right: auto;
  font-size: 0.68rem;
  color: #ffb4a8;
`;

const AddBtn = styled.button`
  appearance: none;
  border: none;
  border-radius: 6px;
  padding: 0.35rem 0.7rem;
  font-family: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(135deg, #00ff88, #00b4d8);
  color: #0a0a0a;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

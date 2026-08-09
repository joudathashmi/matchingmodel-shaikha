import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import {
  AdminUser,
  RoleCatalogItem,
  usersAdminService,
} from "../../store/services/usersAdminService";
import { ROLE_LABELS, ROLES } from "../../common/roles";
import typography from "../../common/typography";
import { selectUserRole } from "../../store/selectors/getUserRoleSelectors";

export default function RoleManagement() {
  const me = useSelector(selectUserRole);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<RoleCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: ROLES.OFFICER as string,
  });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const roleOptions = roles.length
    ? roles.map((r) => r.name)
    : [ROLES.OFFICER, ROLES.REVIEWER, ROLES.ADMIN];

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, r] = await Promise.all([
        usersAdminService.listUsers(),
        usersAdminService.listRoles(),
      ]);
      setUsers(u);
      setRoles(r);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const currentRole = (user: AdminUser) => {
    if (user.roles.includes(ROLES.ADMIN)) return ROLES.ADMIN;
    if (user.roles.includes(ROLES.REVIEWER)) return ROLES.REVIEWER;
    if (user.roles.includes(ROLES.OFFICER) || user.roles.includes("user")) {
      return ROLES.OFFICER;
    }
    return user.roles[0] || ROLES.OFFICER;
  };

  const onChangeRole = async (userId: string, role: string) => {
    setSavingId(userId);
    setError(null);
    setSuccess(null);
    try {
      const updated = await usersAdminService.setUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setSuccess("Role updated");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to update role");
    } finally {
      setSavingId(null);
    }
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.email.trim() || !form.password) {
      setError("Email and password are required");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSavingId("create");
    try {
      const created = await usersAdminService.createUser({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim() || undefined,
        role: form.role,
      });
      setUsers((prev) =>
        [...prev, created].sort((a, b) => a.email.localeCompare(b.email))
      );
      setForm({ name: "", email: "", password: "", role: ROLES.OFFICER as string });
      setShowAdd(false);
      setSuccess(`Created ${created.email}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to create user");
    } finally {
      setSavingId(null);
    }
  };

  const startEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setEditForm({
      name: user.name || "",
      email: user.email,
      password: "",
    });
    setError(null);
    setSuccess(null);
  };

  const onSaveEdit = async (userId: string) => {
    setSavingId(userId);
    setError(null);
    setSuccess(null);
    try {
      const payload: { name?: string; email?: string; password?: string } = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
      };
      if (editForm.password) {
        if (editForm.password.length < 8) {
          setError("Password must be at least 8 characters");
          setSavingId(null);
          return;
        }
        payload.password = editForm.password;
      }
      const updated = await usersAdminService.updateUser(userId, payload);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setEditingId(null);
      setSuccess("User updated");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to update user");
    } finally {
      setSavingId(null);
    }
  };

  const onDelete = async (user: AdminUser) => {
    if (user.id === me?.id) {
      setError("You cannot delete your own account");
      return;
    }
    const ok = window.confirm(
      `Delete ${user.email}? This removes their sessions, bookmarks, and pursuits.`
    );
    if (!ok) return;

    setSavingId(user.id);
    setError(null);
    setSuccess(null);
    try {
      await usersAdminService.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      if (editingId === user.id) setEditingId(null);
      setSuccess(`Deleted ${user.email}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete user");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <Muted>Loading users…</Muted>;
  }

  return (
    <Wrap>
      <Toolbar>
        <Intro>
          Add, edit, or remove users. Assign Officer, Reviewer, or Admin.
        </Intro>
        <AddBtn type="button" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "Cancel" : "+ Add user"}
        </AddBtn>
      </Toolbar>

      {error && <ErrorBox>{error}</ErrorBox>}
      {success && <SuccessBox>{success}</SuccessBox>}

      {showAdd && (
        <AddForm onSubmit={onCreate}>
          <Field>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
            />
          </Field>
          <Field>
            <Label>Email</Label>
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@misa.gov.sa"
            />
          </Field>
          <Field>
            <Label>Password</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 8 characters"
            />
          </Field>
          <Field>
            <Label>Role</Label>
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {roleOptions.map((name) => (
                <option key={name} value={name}>
                  {ROLE_LABELS[name] || name}
                </option>
              ))}
            </Select>
          </Field>
          <SubmitBtn type="submit" disabled={savingId === "create"}>
            {savingId === "create" ? "Creating…" : "Create user"}
          </SubmitBtn>
          <Hint>
            New users must change the temporary password on first sign-in.
            They can also use Forgot password on the login screen.
          </Hint>
        </AddForm>
      )}

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === me?.id;
            const isEditing = editingId === user.id;
            return (
              <React.Fragment key={user.id}>
                <tr>
                  <Td>
                    {isEditing ? (
                      <Input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    ) : (
                      user.name || "-"
                    )}
                  </Td>
                  <Td>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                      />
                    ) : (
                      user.email
                    )}
                  </Td>
                  <Td>
                    <Select
                      value={currentRole(user)}
                      disabled={savingId === user.id || isEditing}
                      onChange={(e) => onChangeRole(user.id, e.target.value)}
                    >
                      {roleOptions.map((name) => (
                        <option key={name} value={name}>
                          {ROLE_LABELS[name] || name}
                        </option>
                      ))}
                    </Select>
                  </Td>
                  <Td>
                    <Actions>
                      {isEditing ? (
                        <>
                          <GhostBtn
                            type="button"
                            onClick={() => onSaveEdit(user.id)}
                            disabled={savingId === user.id}
                          >
                            Save
                          </GhostBtn>
                          <GhostBtn
                            type="button"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </GhostBtn>
                        </>
                      ) : (
                        <>
                          <GhostBtn type="button" onClick={() => startEdit(user)}>
                            Edit
                          </GhostBtn>
                          <DangerBtn
                            type="button"
                            disabled={isSelf || savingId === user.id}
                            title={
                              isSelf
                                ? "You cannot delete your own account"
                                : "Delete user"
                            }
                            onClick={() => onDelete(user)}
                          >
                            Delete
                          </DangerBtn>
                        </>
                      )}
                    </Actions>
                  </Td>
                </tr>
                {isEditing && (
                  <tr>
                    <Td colSpan={4}>
                      <EditPasswordRow>
                        <Label>New password (optional)</Label>
                        <Input
                          type="password"
                          minLength={8}
                          value={editForm.password}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              password: e.target.value,
                            })
                          }
                          placeholder="Leave blank to keep current password"
                          style={{ maxWidth: 320 }}
                        />
                      </EditPasswordRow>
                    </Td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </Table>

      {roles.length > 0 && (
        <RoleHelp>
          {roles.map((r) => (
            <HelpItem key={r.name}>
              <strong>{ROLE_LABELS[r.name] || r.name}</strong> - {r.description}
            </HelpItem>
          ))}
        </RoleHelp>
      )}
    </Wrap>
  );
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-family: "DM Sans", sans-serif;
  color: #ffffff;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Intro = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: ${typography.paragraph.fontSize};
  font-weight: ${typography.paragraph.fontWeight};
  line-height: 1.45;
  max-width: 40rem;
`;

const Muted = styled.div`
  color: rgba(255, 255, 255, 0.55);
  padding: 1rem 0;
  font-size: ${typography.paragraph.fontSize};
`;

const ErrorBox = styled.div`
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fecaca;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
`;

const SuccessBox = styled.div`
  background: rgba(0, 255, 136, 0.08);
  border: 1px solid rgba(0, 200, 140, 0.35);
  color: #9ef0c8;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
`;

const AddForm = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
  align-items: end;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const Label = styled.span`
  font-size: ${typography.filterLabel.fontSize};
  font-weight: ${typography.filterLabel.fontWeight};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
`;

const Input = styled.input`
  background: rgba(0, 0, 0, 0.35);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.5rem 0.65rem;
  font-family: inherit;
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
  width: 100%;
  box-sizing: border-box;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.85rem 1rem;
  font-size: ${typography.filterLabel.fontSize};
  font-weight: ${typography.filterLabel.fontWeight};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Td = styled.td`
  padding: 0.85rem 1rem;
  font-size: ${typography.tableDatas.fontSize};
  font-weight: ${typography.tableDatas.fontWeight};
  color: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  vertical-align: middle;
`;

const Select = styled.select`
  background: rgba(0, 0, 0, 0.35);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.45rem 0.65rem;
  font-family: inherit;
  font-size: ${typography.selectBoxOptions.fontSize};
  font-weight: ${typography.selectBoxOptions.fontWeight};
  min-width: 140px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }

  option {
    background: #1a1a2e;
    color: #ffffff;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

const AddBtn = styled.button`
  border: none;
  border-radius: 8px;
  padding: 0.55rem 1rem;
  font-family: inherit;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  cursor: pointer;
  background: linear-gradient(45deg, #00ff88, #00b4d8);
  color: #0a0a0a;
  white-space: nowrap;
`;

const Hint = styled.p`
  margin: 0.35rem 0 0;
  grid-column: 1 / -1;
  font-size: 0.78rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.55);
`;

const SubmitBtn = styled.button`
  border-radius: 8px;
  padding: 0.55rem 1rem;
  font-family: inherit;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  cursor: pointer;
  background: rgba(0, 255, 136, 0.14);
  color: #9ef0c8;
  border: 1px solid rgba(0, 200, 140, 0.4);
  height: fit-content;

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
`;

const GhostBtn = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.85);
  border-radius: 6px;
  padding: 0.35rem 0.65rem;
  font-family: inherit;
  font-size: ${typography.filterLabel.fontSize};
  font-weight: ${typography.filterLabel.fontWeight};
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const DangerBtn = styled(GhostBtn)`
  border-color: rgba(239, 68, 68, 0.35);
  color: #fecaca;

  &:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.15);
  }
`;

const EditPasswordRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.25rem 0 0.5rem;
`;

const RoleHelp = styled.ul`
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const HelpItem = styled.li`
  font-size: ${typography.Value.fontSize};
  font-weight: ${typography.Value.fontWeight};
  color: rgba(255, 255, 255, 0.5);

  strong {
    color: rgba(255, 255, 255, 0.78);
  }
`;

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import typography from "../../common/typography";
import { ENABLE_SSO, SSO_PROVIDER_LABEL } from "../../config/features";
import axiosClient from "../../api/axiosClient";

const STORAGE_KEYS = {
  matching: "rhq.settings.matching",
  alerts: "rhq.settings.alerts",
} as const;

type MatchingPrefs = {
  minScore: number;
  showRejected: boolean;
  defaultSort: "score" | "recent";
};

type AlertPrefs = {
  emailNewMatches: boolean;
  inAppPursuitMoves: boolean;
  digestDaily: boolean;
};

const defaultMatching: MatchingPrefs = {
  minScore: 60,
  showRejected: false,
  defaultSort: "score",
};

const defaultAlerts: AlertPrefs = {
  emailNewMatches: true,
  inAppPursuitMoves: true,
  digestDaily: false,
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

const Panel = styled.div`
  max-width: 40rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Card = styled.div`
  padding: 1.25rem 1.35rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.35rem;
  font-size: ${typography.Label.fontSize};
  font-weight: ${typography.Label.fontWeight};
  color: #fff;
`;

const Hint = styled.p`
  margin: 0 0 1rem;
  font-size: ${typography.paragraph.fontSize};
  font-weight: ${typography.paragraph.fontWeight};
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.45;
`;

const Row = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: ${typography.paragraph.fontSize};
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  border-radius: 8px;
  padding: 0.4rem 0.65rem;
  font-family: inherit;
  font-size: ${typography.paragraph.fontSize};
`;

const Range = styled.input`
  width: 140px;
`;

const Badge = styled.span<{ $on?: boolean }>`
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.2rem 0.45rem;
  border-radius: 6px;
  border: 1px solid
    ${(p) =>
      p.$on ? "rgba(0, 200, 140, 0.4)" : "rgba(255, 255, 255, 0.2)"};
  color: ${(p) => (p.$on ? "#9ef0c8" : "rgba(255, 255, 255, 0.55)")};
  background: ${(p) =>
    p.$on ? "rgba(0, 255, 136, 0.1)" : "rgba(255, 255, 255, 0.04)"};
`;

const Saved = styled.div`
  font-size: 0.75rem;
  color: #9ef0c8;
`;

const LinkBtn = styled.button`
  appearance: none;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 200, 140, 0.35);
  color: #9ef0c8;
  border-radius: 8px;
  padding: 0.55rem 0.9rem;
  font-family: inherit;
  font-size: ${typography.button.fontSize};
  font-weight: ${typography.button.fontWeight};
  cursor: pointer;

  &:hover {
    background: rgba(0, 255, 136, 0.16);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

export function MatchingSettingsPanel() {
  const [prefs, setPrefs] = useState<MatchingPrefs>(() =>
    loadJson(STORAGE_KEYS.matching, defaultMatching)
  );
  const [saved, setSaved] = useState(false);

  const update = (next: Partial<MatchingPrefs>) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    saveJson(STORAGE_KEYS.matching, merged);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Panel>
      <Card>
        <SectionTitle>Match display</SectionTitle>
        <Hint>
          Local preferences for how matches appear in the workbench. Model
          weights remain controlled by the matching service.
        </Hint>
        <Row>
          <span>Minimum score to show</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Range
              type="range"
              min={40}
              max={95}
              value={prefs.minScore}
              onChange={(e) => update({ minScore: Number(e.target.value) })}
            />
            <span>{prefs.minScore}%</span>
          </div>
        </Row>
        <Row>
          <span>Default sort</span>
          <Select
            value={prefs.defaultSort}
            onChange={(e) =>
              update({ defaultSort: e.target.value as MatchingPrefs["defaultSort"] })
            }
          >
            <option value="score">Highest score</option>
            <option value="recent">Most recent</option>
          </Select>
        </Row>
        <Row>
          <span>Show rejected matches</span>
          <input
            type="checkbox"
            checked={prefs.showRejected}
            onChange={(e) => update({ showRejected: e.target.checked })}
          />
        </Row>
        {saved && <Saved>Saved on this device</Saved>}
      </Card>
    </Panel>
  );
}

export function AlertsSettingsPanel() {
  const [prefs, setPrefs] = useState<AlertPrefs>(() =>
    loadJson(STORAGE_KEYS.alerts, defaultAlerts)
  );
  const [saved, setSaved] = useState(false);

  const update = (next: Partial<AlertPrefs>) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    saveJson(STORAGE_KEYS.alerts, merged);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Panel>
      <Card>
        <SectionTitle>Notifications</SectionTitle>
        <Hint>
          Choose which events you want surfaced. Email delivery uses your account
          address when the mail service is connected.
        </Hint>
        <Row>
          <span>Email when new high-score matches appear</span>
          <input
            type="checkbox"
            checked={prefs.emailNewMatches}
            onChange={(e) => update({ emailNewMatches: e.target.checked })}
          />
        </Row>
        <Row>
          <span>In-app notice when pursuits move stage</span>
          <input
            type="checkbox"
            checked={prefs.inAppPursuitMoves}
            onChange={(e) => update({ inAppPursuitMoves: e.target.checked })}
          />
        </Row>
        <Row>
          <span>Daily digest summary</span>
          <input
            type="checkbox"
            checked={prefs.digestDaily}
            onChange={(e) => update({ digestDaily: e.target.checked })}
          />
        </Row>
        {saved && <Saved>Saved on this device</Saved>}
      </Card>
    </Panel>
  );
}

export function IntegrationsSettingsPanel() {
  return (
    <Panel>
      <Card>
        <SectionTitle>Data connections</SectionTitle>
        <Hint>
          Company and opportunity catalogs are loaded from the platform database.
          External connectors can be added without changing officer workflows.
        </Hint>
        <Row>
          <span>Company catalog</span>
          <Badge $on>Connected</Badge>
        </Row>
        <Row>
          <span>Opportunity catalog</span>
          <Badge $on>Connected</Badge>
        </Row>
        <Row>
          <span>Matching engine</span>
          <Badge $on>Connected</Badge>
        </Row>
      </Card>
    </Panel>
  );
}

export function SecuritySettingsPanel() {
  return (
    <Panel>
      <Card>
        <SectionTitle>Sign-in</SectionTitle>
        <Hint>
          Email and password is the active method. National sign-in is wired in
          the backend but not enabled for this environment.
        </Hint>
        <Row>
          <span>Email / password</span>
          <Badge $on>Active</Badge>
        </Row>
        <Row>
          <span>{SSO_PROVIDER_LABEL}</span>
          <Badge $on={ENABLE_SSO}>{ENABLE_SSO ? "Enabled" : "Disabled"}</Badge>
        </Row>
      </Card>
      <Card>
        <SectionTitle>Session</SectionTitle>
        <Hint>
          Access tokens refresh automatically. When refresh fails, you are
          returned to the login screen with a session-expired notice.
        </Hint>
        <Row>
          <span>Idle session handling</span>
          <Badge $on>Standard</Badge>
        </Row>
      </Card>
    </Panel>
  );
}

export function ExportSettingsPanel() {
  const downloadJson = (filename: string, data: unknown) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPrefs = () => {
    downloadJson(`rhq-settings-${new Date().toISOString().slice(0, 10)}.json`, {
      matching: loadJson(STORAGE_KEYS.matching, defaultMatching),
      alerts: loadJson(STORAGE_KEYS.alerts, defaultAlerts),
      exportedAt: new Date().toISOString(),
    });
  };

  return (
    <Panel>
      <Card>
        <SectionTitle>Export</SectionTitle>
        <Hint>
          Download your local preferences, or use Match decisions / Pursuit for
          operational records. Broader data exports can be added for your unit.
        </Hint>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <LinkBtn type="button" onClick={exportPrefs}>
            Download preferences (JSON)
          </LinkBtn>
        </div>
      </Card>
    </Panel>
  );
}

export function LicensingSettingsPanel() {
  return (
    <Panel>
      <Card>
        <SectionTitle>Platform access</SectionTitle>
        <Hint>
          This deployment is licensed for internal investment attraction use.
          Contact your platform administrator for seat changes.
        </Hint>
        <Row>
          <span>Environment</span>
          <Badge $on>Internal</Badge>
        </Row>
        <Row>
          <span>Roles in use</span>
          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem" }}>
            Officer · Reviewer · Admin
          </span>
        </Row>
      </Card>
    </Panel>
  );
}

type AuditRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  actor: { id: string; email: string; name: string | null } | null;
  metadata?: unknown;
};

export function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axiosClient.get("/audit");
        if (!cancelled) setLogs(data.logs || []);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.response?.data?.message || "Could not load audit log");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Panel>
      <Card>
        <SectionTitle>Activity log</SectionTitle>
        <Hint>
          Role changes and match decisions recorded for accountability.
        </Hint>
        {loading && <Hint>Loading…</Hint>}
        {error && <Hint style={{ color: "#fca5a5" }}>{error}</Hint>}
        {!loading && !error && logs.length === 0 && (
          <Hint>No audit events yet.</Hint>
        )}
        {!loading &&
          logs.map((log) => (
            <Row key={log.id} as="div" style={{ cursor: "default" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{log.action}</div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.45)",
                    marginTop: 2,
                  }}
                >
                  {log.actor?.email || "system"} · {log.entityType}
                  {log.entityId ? ` #${log.entityId}` : ""} ·{" "}
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            </Row>
          ))}
      </Card>
    </Panel>
  );
}

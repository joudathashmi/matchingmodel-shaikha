import React, { useEffect, useState } from "react";
import styled from "styled-components";
import typography from "../../common/typography";
import axiosClient from "../../api/axiosClient";

type Protocol = "oidc" | "saml" | "ldap";

type IdentityConfig = {
  prepared: boolean;
  protocol: Protocol;
  displayName: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  issuerUrl: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  jwksUri: string;
  redirectUri: string;
  logoutUrl: string;
  scopes: string;
  allowedDomains: string;
  groupClaim: string;
  adminGroup: string;
  officerGroup: string;
  reviewerGroup: string;
  ldapHost: string;
  ldapPort: string;
  ldapBaseDn: string;
  ldapBindDn: string;
  ldapBindPassword: string;
  ldapUserFilter: string;
  notes: string;
  hasClientSecret?: boolean;
  hasLdapBindPassword?: boolean;
};

const emptyConfig = (): IdentityConfig => ({
  prepared: false,
  protocol: "oidc",
  displayName: "MISA Active Directory",
  tenantId: "",
  clientId: "",
  clientSecret: "",
  issuerUrl: "",
  authorizationEndpoint: "",
  tokenEndpoint: "",
  jwksUri: "",
  redirectUri: "http://localhost:4000/api/auth/sso/callback",
  logoutUrl: "",
  scopes: "openid profile email",
  allowedDomains: "misa.gov.sa",
  groupClaim: "groups",
  adminGroup: "",
  officerGroup: "",
  reviewerGroup: "",
  ldapHost: "",
  ldapPort: "389",
  ldapBaseDn: "",
  ldapBindDn: "",
  ldapBindPassword: "",
  ldapUserFilter: "(sAMAccountName={{username}})",
  notes: "",
});

const ActiveDirectorySettings: React.FC = () => {
  const [config, setConfig] = useState<IdentityConfig>(emptyConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [runtimeNote, setRuntimeNote] = useState<string>("");
  const [envSsoEnabled, setEnvSsoEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axiosClient.get("/identity-provider");
        if (cancelled) return;
        setConfig({
          ...emptyConfig(),
          ...data.config,
          clientSecret: data.config?.hasClientSecret ? "••••••••" : "",
          ldapBindPassword: data.config?.hasLdapBindPassword ? "••••••••" : "",
        });
        setRuntimeNote(data.runtime?.note || "");
        setEnvSsoEnabled(Boolean(data.runtime?.envSsoEnabled));
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.response?.data?.message ||
              "Could not load Active Directory settings"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = <K extends keyof IdentityConfig>(key: K, value: IdentityConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const payload = { ...config };
      if (payload.clientSecret === "••••••••") delete (payload as any).clientSecret;
      if (payload.ldapBindPassword === "••••••••") {
        delete (payload as any).ldapBindPassword;
      }
      const { data } = await axiosClient.put("/identity-provider", payload);
      setConfig({
        ...emptyConfig(),
        ...data.config,
        clientSecret: data.config?.hasClientSecret ? "••••••••" : "",
        ldapBindPassword: data.config?.hasLdapBindPassword ? "••••••••" : "",
      });
      setMessage(data.message || "Saved");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Hint>Loading Active Directory settings…</Hint>;
  }

  return (
    <Panel>
      <Card>
        <SectionTitle>Enterprise identity (Active Directory)</SectionTitle>
        <Hint>
          Admins can capture directory / SSO parameters now so engineering can
          switch on Active Directory later without redesigning login. Saving here
          does not turn on live SSO by itself.
        </Hint>
        {runtimeNote ? <Hint>{runtimeNote}</Hint> : null}
        <StatusRow>
          <span>Parameters ready</span>
          <Badge $on={config.prepared}>
            {config.prepared ? "Marked ready" : "Draft"}
          </Badge>
        </StatusRow>
        <StatusRow>
          <span>Runtime SSO flag (ENABLE_SSO)</span>
          <Badge $on={envSsoEnabled}>
            {envSsoEnabled ? "Enabled in env" : "Off in env"}
          </Badge>
        </StatusRow>
      </Card>

      <Card>
        <SectionTitle>Connection</SectionTitle>
        <Field>
          <Label>Protocol</Label>
          <Select
            value={config.protocol}
            onChange={(e) => update("protocol", e.target.value as Protocol)}
          >
            <option value="oidc">OIDC (Entra ID / Azure AD)</option>
            <option value="saml">SAML 2.0</option>
            <option value="ldap">LDAP / on-prem AD</option>
          </Select>
        </Field>
        <Field>
          <Label>Display name</Label>
          <Input
            value={config.displayName}
            onChange={(e) => update("displayName", e.target.value)}
            placeholder="MISA Active Directory"
          />
        </Field>
        <Field>
          <Label>Tenant / directory ID</Label>
          <Input
            value={config.tenantId}
            onChange={(e) => update("tenantId", e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
        </Field>
        <Field>
          <Label>Application (client) ID</Label>
          <Input
            value={config.clientId}
            onChange={(e) => update("clientId", e.target.value)}
          />
        </Field>
        <Field>
          <Label>Client secret</Label>
          <Input
            type="password"
            autoComplete="new-password"
            value={config.clientSecret}
            onChange={(e) => update("clientSecret", e.target.value)}
            placeholder="Stored encrypted in app settings; leave masked to keep"
          />
        </Field>
        <Field>
          <Label>Issuer / authority URL</Label>
          <Input
            value={config.issuerUrl}
            onChange={(e) => update("issuerUrl", e.target.value)}
            placeholder="https://login.microsoftonline.com/{tenant}/v2.0"
          />
        </Field>
        <Field>
          <Label>Redirect URI</Label>
          <Input
            value={config.redirectUri}
            onChange={(e) => update("redirectUri", e.target.value)}
          />
        </Field>
        <Field>
          <Label>Logout URL</Label>
          <Input
            value={config.logoutUrl}
            onChange={(e) => update("logoutUrl", e.target.value)}
          />
        </Field>
        <Field>
          <Label>Scopes</Label>
          <Input
            value={config.scopes}
            onChange={(e) => update("scopes", e.target.value)}
          />
        </Field>
        <Field>
          <Label>Allowed email domains</Label>
          <Input
            value={config.allowedDomains}
            onChange={(e) => update("allowedDomains", e.target.value)}
            placeholder="misa.gov.sa"
          />
        </Field>
      </Card>

      {(config.protocol === "oidc" || config.protocol === "saml") && (
        <Card>
          <SectionTitle>Endpoints (optional advanced)</SectionTitle>
          <Field>
            <Label>Authorization endpoint</Label>
            <Input
              value={config.authorizationEndpoint}
              onChange={(e) => update("authorizationEndpoint", e.target.value)}
            />
          </Field>
          <Field>
            <Label>Token endpoint</Label>
            <Input
              value={config.tokenEndpoint}
              onChange={(e) => update("tokenEndpoint", e.target.value)}
            />
          </Field>
          <Field>
            <Label>JWKS URI</Label>
            <Input
              value={config.jwksUri}
              onChange={(e) => update("jwksUri", e.target.value)}
            />
          </Field>
        </Card>
      )}

      {config.protocol === "ldap" && (
        <Card>
          <SectionTitle>LDAP directory</SectionTitle>
          <Field>
            <Label>Host</Label>
            <Input
              value={config.ldapHost}
              onChange={(e) => update("ldapHost", e.target.value)}
              placeholder="ldap.misa.gov.sa"
            />
          </Field>
          <Field>
            <Label>Port</Label>
            <Input
              value={config.ldapPort}
              onChange={(e) => update("ldapPort", e.target.value)}
            />
          </Field>
          <Field>
            <Label>Base DN</Label>
            <Input
              value={config.ldapBaseDn}
              onChange={(e) => update("ldapBaseDn", e.target.value)}
              placeholder="DC=misa,DC=gov,DC=sa"
            />
          </Field>
          <Field>
            <Label>Bind DN</Label>
            <Input
              value={config.ldapBindDn}
              onChange={(e) => update("ldapBindDn", e.target.value)}
            />
          </Field>
          <Field>
            <Label>Bind password</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={config.ldapBindPassword}
              onChange={(e) => update("ldapBindPassword", e.target.value)}
            />
          </Field>
          <Field>
            <Label>User filter</Label>
            <Input
              value={config.ldapUserFilter}
              onChange={(e) => update("ldapUserFilter", e.target.value)}
            />
          </Field>
        </Card>
      )}

      <Card>
        <SectionTitle>Role mapping</SectionTitle>
        <Hint>
          Map directory groups to desk roles when SSO goes live. Leave blank
          until IT confirms group names.
        </Hint>
        <Field>
          <Label>Group claim</Label>
          <Input
            value={config.groupClaim}
            onChange={(e) => update("groupClaim", e.target.value)}
          />
        </Field>
        <Field>
          <Label>Admin group</Label>
          <Input
            value={config.adminGroup}
            onChange={(e) => update("adminGroup", e.target.value)}
          />
        </Field>
        <Field>
          <Label>Officer group</Label>
          <Input
            value={config.officerGroup}
            onChange={(e) => update("officerGroup", e.target.value)}
          />
        </Field>
        <Field>
          <Label>Reviewer group</Label>
          <Input
            value={config.reviewerGroup}
            onChange={(e) => update("reviewerGroup", e.target.value)}
          />
        </Field>
      </Card>

      <Card>
        <SectionTitle>Notes & readiness</SectionTitle>
        <Field>
          <Label>Integration notes</Label>
          <TextArea
            value={config.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Contacts, ticket numbers, cutover date…"
            rows={4}
          />
        </Field>
        <ReadyRow>
          <div>
            <ReadyTitle>Mark parameters ready for integration</ReadyTitle>
            <Hint style={{ margin: 0 }}>
              Signals to engineering that values are complete enough to wire
              live Active Directory sign-in.
            </Hint>
          </div>
          <Toggle
            type="checkbox"
            checked={config.prepared}
            onChange={(e) => update("prepared", e.target.checked)}
            aria-label="Mark Active Directory parameters ready"
          />
        </ReadyRow>
      </Card>

      {error && <ErrorText>{error}</ErrorText>}
      {message && <SavedText>{message}</SavedText>}

      <Actions>
        <SaveBtn type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Active Directory settings"}
        </SaveBtn>
      </Actions>
    </Panel>
  );
};

export default ActiveDirectorySettings;

const Panel = styled.div`
  max-width: 44rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
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

const StatusRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  font-size: ${typography.paragraph.fontSize};

  &:last-child {
    border-bottom: none;
  }
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
    p.$on ? "rgba(0, 255, 136, 0.08)" : "rgba(255, 255, 255, 0.04)"};
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.85rem;
`;

const Label = styled.span`
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #fff;
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
  font-family: inherit;
  font-size: ${typography.paragraph.fontSize};

  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #fff;
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
  font-family: inherit;
  font-size: ${typography.paragraph.fontSize};
`;

const TextArea = styled.textarea`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #fff;
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
  font-family: inherit;
  font-size: ${typography.paragraph.fontSize};
  resize: vertical;
`;

const ReadyRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const ReadyTitle = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  font-size: ${typography.paragraph.fontSize};
  margin-bottom: 0.25rem;
`;

const Toggle = styled.input`
  width: 1.15rem;
  height: 1.15rem;
  margin-top: 0.2rem;
  accent-color: #00c88c;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-start;
`;

const SaveBtn = styled.button`
  appearance: none;
  border: none;
  border-radius: 10px;
  padding: 0.7rem 1.1rem;
  background: linear-gradient(135deg, #00ff88, #00b4d8);
  color: #0a0a0a;
  font-family: inherit;
  font-size: ${typography.button.fontSize};
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`;

const ErrorText = styled.div`
  color: #fca5a5;
  font-size: 0.85rem;
`;

const SavedText = styled.div`
  color: #9ef0c8;
  font-size: 0.85rem;
`;

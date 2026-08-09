export type IdentityProtocol = "oidc" | "saml" | "ldap";

export type IdentityProviderConfig = {
  /** When true, parameters are considered ready for engineering to wire live SSO */
  prepared: boolean;
  /** Live login button still requires ENABLE_SSO env + provider wiring */
  protocol: IdentityProtocol;
  displayName: string;
  /** Entra / Azure AD tenant, or AD domain */
  tenantId: string;
  clientId: string;
  /** Stored server-side only; never returned in clear after save */
  clientSecret: string;
  issuerUrl: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  jwksUri: string;
  redirectUri: string;
  logoutUrl: string;
  scopes: string;
  /** Comma-separated email domains allowed to sign in via IdP */
  allowedDomains: string;
  /** Claim used for group / role mapping */
  groupClaim: string;
  adminGroup: string;
  officerGroup: string;
  reviewerGroup: string;
  /** LDAP-specific (used when protocol = ldap) */
  ldapHost: string;
  ldapPort: string;
  ldapBaseDn: string;
  ldapBindDn: string;
  ldapBindPassword: string;
  ldapUserFilter: string;
  notes: string;
};

export const IDENTITY_SETTING_KEY = "identity_provider";

export const defaultIdentityConfig = (): IdentityProviderConfig => ({
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

export type IdentityProviderPublicConfig = Omit<
  IdentityProviderConfig,
  "clientSecret" | "ldapBindPassword"
> & {
  hasClientSecret: boolean;
  hasLdapBindPassword: boolean;
};

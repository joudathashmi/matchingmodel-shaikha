/** Client feature flags. SSO UI is wired but disabled unless explicitly enabled. */
export const ENABLE_SSO =
  String(process.env.REACT_APP_ENABLE_SSO || "").toLowerCase() === "true";

export const SSO_PROVIDER_LABEL = "National sign-in";

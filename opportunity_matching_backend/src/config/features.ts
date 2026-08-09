/** Feature flags - SSO/Nafath is implemented but off by default. */
export function isSsoEnabled(): boolean {
  return String(process.env.ENABLE_SSO || "").toLowerCase() === "true";
}

export function getSsoProvider(): string {
  return process.env.SSO_PROVIDER || "nafath";
}

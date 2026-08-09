/** Dark desk tokens (product UI is dark-first). */
export const themeCss = `
  :root,
  html[data-theme="dark"] {
    --rhq-bg-0: #07090f;
    --rhq-bg-1: #0d1220;
    --rhq-bg-2: #10182a;
    --rhq-glow-a: rgba(0, 255, 136, 0.07);
    --rhq-glow-b: rgba(0, 180, 216, 0.08);
    --rhq-text: #ffffff;
    --rhq-text-muted: rgba(255, 255, 255, 0.62);
    --rhq-surface: rgba(255, 255, 255, 0.03);
    --rhq-surface-strong: rgba(14, 18, 32, 0.96);
    --rhq-border: rgba(255, 255, 255, 0.1);
    --rhq-header-bg: linear-gradient(
      180deg,
      rgba(14, 18, 32, 0.92) 0%,
      rgba(10, 12, 22, 0.88) 100%
    );
    --rhq-sidebar-bg: rgba(255, 255, 255, 0.03);
    --rhq-input-bg: rgba(255, 255, 255, 0.04);
    --rhq-card-bg: rgba(20, 28, 36, 0.92);
    --rhq-card-border: rgba(255, 255, 255, 0.1);
    --rhq-shadow: rgba(0, 0, 0, 0.45);
  }
`;

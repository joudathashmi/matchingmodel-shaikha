import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import styled, { keyframes } from "styled-components";
import { driver, type DriveStep, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./tourTheme.css";
import {
  selectIsAdmin,
  selectUserRole,
  selectUserRoleLoading,
} from "../store/selectors/getUserRoleSelectors";
import { selectIsAuthenticated as selectAuthOk } from "../store/selectors/authSelectors";
import { stepsForRole, type TourStepDef } from "./tourSteps";
import {
  consumeTourPending,
  hasCompletedTour,
  markTourCompleted,
  clearTourCompleted,
} from "./tourStorage";
import { useTour } from "./TourContext";
import typography from "../common/typography";

function waitForElement(
  selector: string,
  timeoutMs = 4000
): Promise<Element | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }
    const started = Date.now();
    const obs = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        obs.disconnect();
        resolve(el);
      } else if (Date.now() - started > timeoutMs) {
        obs.disconnect();
        resolve(null);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      obs.disconnect();
      resolve(document.querySelector(selector));
    }, timeoutMs);
  });
}

const GuidedTour: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { registerRunner } = useTour();
  const user = useSelector(selectUserRole);
  const roleLoading = useSelector(selectUserRoleLoading);
  const isAdmin = useSelector(selectIsAdmin);
  const authOk = useSelector(selectAuthOk);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const driverRef = useRef<Driver | null>(null);
  const stepsRef = useRef<TourStepDef[]>([]);
  const finishingRef = useRef(false);
  const autoCheckedRef = useRef(false);

  const destroyDriver = useCallback(() => {
    try {
      driverRef.current?.destroy();
    } catch {
      /* ignore */
    }
    driverRef.current = null;
    document.body.classList.remove("rhq-tour-active");
  }, []);

  const finishTour = useCallback(
    (completed: boolean) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      destroyDriver();
      setWelcomeOpen(false);
      if (completed && user?.id) {
        markTourCompleted(user.id);
      }
      finishingRef.current = false;
    },
    [destroyDriver, user?.id]
  );

  const runSpotlight = useCallback(async () => {
    if (!user?.id) return;
    destroyDriver();

    const defs = stepsForRole(isAdmin);
    stepsRef.current = defs;

    // Ensure first route is ready
    const first = defs[0];
    if (first?.route && location.pathname !== first.route) {
      navigate(first.route);
      await waitForElement(first.element);
    } else if (first) {
      await waitForElement(first.element);
    }

    const driveSteps: DriveStep[] = defs.map((step, index) => ({
      element: step.element,
      popover: {
        title: step.title,
        description: step.description,
        side: step.side || "right",
        align: "start",
        showButtons: ["next", "previous", "close"],
        nextBtnText: index === defs.length - 1 ? "Finish" : "Next",
        prevBtnText: "Back",
        doneBtnText: "Finish",
        progressText: `{{current}} of {{total}}`,
        onNextClick: async (_el, _step, { driver: d }) => {
          const nextIndex = Number(d.getActiveIndex() ?? 0) + 1;
          if (nextIndex >= defs.length) {
            finishTour(true);
            return;
          }
          const next = defs[nextIndex];
          if (next.route && window.location.pathname !== next.route) {
            navigate(next.route);
            await waitForElement(next.element);
          } else {
            await waitForElement(next.element, 2000);
          }
          d.moveNext();
        },
        onPrevClick: async (_el, _step, { driver: d }) => {
          const prevIndex = Number(d.getActiveIndex() ?? 0) - 1;
          if (prevIndex < 0) return;
          const prev = defs[prevIndex];
          if (prev.route && window.location.pathname !== prev.route) {
            navigate(prev.route);
            await waitForElement(prev.element);
          }
          d.movePrevious();
        },
        onCloseClick: () => {
          finishTour(true);
        },
      },
    }));

    const d = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: "rgba(4, 8, 16, 0.72)",
      stagePadding: 10,
      stageRadius: 12,
      popoverClass: "rhq-tour-popover",
      steps: driveSteps,
      onDestroyStarted: () => {
        if (!finishingRef.current) {
          finishTour(true);
        }
      },
    });

    driverRef.current = d;
    document.body.classList.add("rhq-tour-active");
    setWelcomeOpen(false);
    d.drive();
  }, [
    user?.id,
    isAdmin,
    location.pathname,
    navigate,
    destroyDriver,
    finishTour,
  ]);

  const openWelcome = useCallback(
    (opts?: { force?: boolean }) => {
      if (!user?.id) return;
      if (!opts?.force && hasCompletedTour(user.id)) return;
      // Don't run on login/signup routes
      if (
        location.pathname === "/" ||
        location.pathname === "/signup"
      ) {
        return;
      }
      destroyDriver();
      setWelcomeOpen(true);
    },
    [user?.id, location.pathname, destroyDriver]
  );

  // Register with context for Settings replay
  useEffect(() => {
    registerRunner((opts) => {
      if (opts?.force && user?.id) {
        clearTourCompleted(user.id);
      }
      openWelcome({ force: true });
    });
    return () => registerRunner(null);
  }, [registerRunner, openWelcome, user?.id]);

  // Auto-start after login (pending flag) or first-ever session
  useEffect(() => {
    if (autoCheckedRef.current) return;
    if (!authOk || !user?.id || roleLoading) return;
    if (location.pathname === "/" || location.pathname === "/signup") return;

    autoCheckedRef.current = true;
    consumeTourPending();
    const firstTime = !hasCompletedTour(user.id);

    // Show once for first-time users
    if (firstTime) {
      const t = window.setTimeout(() => openWelcome(), 700);
      return () => window.clearTimeout(t);
    }
  }, [
    authOk,
    user?.id,
    roleLoading,
    location.pathname,
    openWelcome,
  ]);

  // Reset auto-check when user logs out
  useEffect(() => {
    if (!authOk) {
      autoCheckedRef.current = false;
      destroyDriver();
      setWelcomeOpen(false);
    }
  }, [authOk, destroyDriver]);

  useEffect(() => () => destroyDriver(), [destroyDriver]);

  const welcome = welcomeOpen
    ? createPortal(
        <WelcomeRoot role="dialog" aria-modal="true" aria-labelledby="tour-welcome-title">
          <WelcomeBackdrop onClick={() => finishTour(true)} />
          <WelcomeCard>
            <WelcomeGlow />
            <WelcomeEyebrow>Investor Attraction</WelcomeEyebrow>
            <WelcomeTitle id="tour-welcome-title">
              A quick tour of your workspace
            </WelcomeTitle>
            <WelcomeBody>
              In under a minute, see how Matching overview, Matches, and Pursuit fit
              together - so you know exactly where to triage and advance deals.
            </WelcomeBody>
            <WelcomeMeta>
              <MetaDot />
              {stepsForRole(isAdmin).length} steps · skip anytime
            </WelcomeMeta>
            <WelcomeActions>
              <GhostBtn type="button" onClick={() => finishTour(true)}>
                Skip for now
              </GhostBtn>
              <PrimaryBtn type="button" onClick={() => void runSpotlight()}>
                Start tour
              </PrimaryBtn>
            </WelcomeActions>
          </WelcomeCard>
        </WelcomeRoot>,
        document.body
      )
    : null;

  return welcome;
};

export default GuidedTour;

/* ── Welcome modal ── */

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const riseIn = keyframes`
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const WelcomeRoot = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10050;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  animation: ${fadeIn} 0.35s ease;
`;

const WelcomeBackdrop = styled.div`
  position: absolute;
  inset: 0;
  background:
    radial-gradient(800px 400px at 50% 40%, rgba(0, 255, 136, 0.08), transparent 60%),
    rgba(4, 8, 16, 0.78);
  backdrop-filter: blur(6px);
`;

const WelcomeCard = styled.div`
  position: relative;
  width: min(420px, 100%);
  padding: 2rem 1.75rem 1.6rem;
  border-radius: 18px;
  border: 1px solid rgba(0, 200, 140, 0.28);
  background: linear-gradient(
    165deg,
    rgba(20, 28, 46, 0.98) 0%,
    rgba(10, 14, 24, 0.98) 100%
  );
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04),
    0 32px 80px rgba(0, 0, 0, 0.55),
    0 0 60px rgba(0, 255, 136, 0.1);
  overflow: hidden;
  animation: ${riseIn} 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  font-family: "DM Sans", sans-serif;
`;

const WelcomeGlow = styled.div`
  position: absolute;
  top: -40%;
  left: 20%;
  right: 20%;
  height: 60%;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 255, 136, 0.18),
    transparent 70%
  );
  pointer-events: none;
`;

const WelcomeEyebrow = styled.div`
  position: relative;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(158, 240, 200, 0.9);
  margin-bottom: 0.65rem;
`;

const WelcomeTitle = styled.h2`
  position: relative;
  margin: 0 0 0.65rem;
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.25;
  color: #ffffff;
`;

const WelcomeBody = styled.p`
  position: relative;
  margin: 0 0 1.15rem;
  font-size: ${typography.paragraph.fontSize};
  font-weight: ${typography.paragraph.fontWeight};
  color: rgba(255, 255, 255, 0.62);
  line-height: 1.55;
`;

const WelcomeMeta = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.42);
  margin-bottom: 1.35rem;
`;

const MetaDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00ff88, #00b4d8);
`;

const WelcomeActions = styled.div`
  position: relative;
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const GhostBtn = styled.button`
  appearance: none;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.75);
  border-radius: 8px;
  padding: 0.55rem 0.95rem;
  font-family: inherit;
  font-size: ${typography.button.fontSize};
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.28);
    color: #fff;
  }
`;

const PrimaryBtn = styled.button`
  appearance: none;
  background: linear-gradient(135deg, #00ff88, #00b4d8);
  border: none;
  color: #0a0a0a;
  border-radius: 8px;
  padding: 0.55rem 1.15rem;
  font-family: inherit;
  font-size: ${typography.button.fontSize};
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.05);
  }
`;

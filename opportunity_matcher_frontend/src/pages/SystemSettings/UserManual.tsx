import React, { useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import typography from "../../common/typography";
import { useSelector } from "react-redux";
import { selectIsAdmin } from "../../store/selectors/getUserRoleSelectors";

type Section = {
  id: string;
  title: string;
  body: React.ReactNode;
  adminOnly?: boolean;
};

const SECTIONS: Section[] = [
  {
    id: "start",
    title: "Getting started",
    body: (
      <>
        <p>
          This platform helps MISA officers match investor companies to
          investment opportunities, review evidence, and move strong pairs into
          pursuit.
        </p>
        <ul>
          <li>
            Sign in with the email and temporary password provided by your
            administrator.
          </li>
          <li>
            On first login you will be asked to set a new password before using
            the desk.
          </li>
          <li>
            If you forget your password, use <em>Forgot password?</em> on the
            sign-in screen.
          </li>
          <li>
            There is no public sign-up. Accounts are created by an administrator
            only.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "nav",
    title: "Main navigation",
    body: (
      <>
        <ul>
          <li>
            <strong>Matching overview</strong> — programme pulse: coverage,
            insights, and high-level findings.
          </li>
          <li>
            <strong>Matches</strong> (Match Workbench) — ranked company–opportunity
            pairs to triage.
          </li>
          <li>
            <strong>Pursuit</strong> — live deal pipeline after you start pursuit
            on a match.
          </li>
          <li>
            <strong>Discover opportunities</strong> — explore candidates and
            whitespace.
          </li>
          <li>
            <strong>Companies / Opportunities</strong> — full catalogs; bookmark
            records to return later.
          </li>
          <li>
            <strong>Analytics</strong> — live performance of the current matching
            book (export PNG, PDF, Word, PowerPoint).
          </li>
          <li>
            <strong>Settings</strong> — preferences and this guide; admins also
            manage users.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "workbench",
    title: "Match Workbench",
    body: (
      <>
        <p>
          Open <Link to="/match-workbench">Matches</Link> to see scored pairs.
        </p>
        <ul>
          <li>
            Each card shows decision tier, confidence, top strength, key risk,
            and score breakdown (profile, product, similarity).
          </li>
          <li>
            Use filters (sector, score range) to focus the list.
          </li>
          <li>
            <strong>Open Match Case</strong> for full evidence, reasons, and
            Agree / Not a fit.
          </li>
          <li>
            <strong>Start pursuit</strong> moves a strong pair onto your Pursuit
            pipeline.
          </li>
        </ul>
        <p>
          Tiers: <em>Excellent</em> / <em>Strong</em> / <em>Good</em> are
          pursue-grade. <em>Potential</em> needs more evidence.{" "}
          <em>Weak</em> is usually a hold.
        </p>
      </>
    ),
  },
  {
    id: "case",
    title: "Match Case",
    body: (
      <>
        <p>Use Match Case before facilitating outreach.</p>
        <ul>
          <li>Read strengths, risks, and recommended engagement.</li>
          <li>
            Record <strong>Agree</strong> or <strong>Not a fit</strong> so the
            team’s judgment is captured.
          </li>
          <li>Add comments for handoff between officers.</li>
        </ul>
      </>
    ),
  },
  {
    id: "pursuit",
    title: "Pursuit pipeline",
    body: (
      <>
        <p>
          After starting pursuit, track the deal in{" "}
          <Link to="/pursuit">Pursuit</Link>:
        </p>
        <ul>
          <li>Engage → Plan shared → MoU → Landed</li>
          <li>Keep notes current so leadership can see status without chasing email.</li>
        </ul>
      </>
    ),
  },
  {
    id: "analytics",
    title: "Analytics",
    body: (
      <>
        <p>
          <Link to="/analytics">Analytics</Link> reflects the live matching book
          (MatchingOutput), not static demo numbers.
        </p>
        <ul>
          <li>KPIs: pursue yield, coverage, backlog, cold companies.</li>
          <li>Charts: sector density, decision quality, score distribution, tier mix.</li>
          <li>
            Export a chart or the full pack as PNG, PDF, Word, or PowerPoint.
            Word/PPT charts can be edited in Office (Chart Design → Edit Data).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "admin",
    title: "Admin: users & roles",
    adminOnly: true,
    body: (
      <>
        <p>
          In Settings → <strong>Users & roles</strong> you can:
        </p>
        <ul>
          <li>Create an officer or admin with a temporary password.</li>
          <li>
            The new user must change that password on first sign-in.
          </li>
          <li>Edit name/email, reset a temporary password, or delete a user.</li>
          <li>
            Only admins can create or delete users. Officers have full desk
            access without user management.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "tips",
    title: "Working tips",
    body: (
      <>
        <ul>
          <li>
            Prefer High-confidence Excellent/Strong pairs for outreach this
            week.
          </li>
          <li>
            Treat Low-confidence pursues as hold until Match Case evidence
            improves.
          </li>
          <li>
            Replay the product tour from Settings → Preferences if you need a
            quick walkthrough of the interface.
          </li>
          <li>
            For access issues contact your administrator or{" "}
            <a href="mailto:DBI@misa.gov.sa">DBI@misa.gov.sa</a>.
          </li>
        </ul>
      </>
    ),
  },
];

const UserManual: React.FC = () => {
  const isAdmin = useSelector(selectIsAdmin);
  const sections = SECTIONS.filter((s) => !s.adminOnly || isAdmin);
  const [openId, setOpenId] = useState(sections[0]?.id || "start");

  return (
    <Layout>
      <Toc>
        <TocTitle>Contents</TocTitle>
        {sections.map((s) => (
          <TocBtn
            key={s.id}
            type="button"
            $active={openId === s.id}
            onClick={() => setOpenId(s.id)}
          >
            {s.title}
          </TocBtn>
        ))}
      </Toc>
      <Article>
        {sections.map((s) =>
          openId === s.id ? (
            <Section key={s.id}>
              <SectionTitle>{s.title}</SectionTitle>
              <Body>{s.body}</Body>
            </Section>
          ) : null
        )}
        <FooterNote>
          Dynamo Intelligent Opportunity Matcher · MISA Investor Attraction desk
          guide
        </FooterNote>
      </Article>
    </Layout>
  );
};

export default UserManual;

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const Toc = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  position: sticky;
  top: 1rem;
`;

const TocTitle = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 0.35rem;
`;

const TocBtn = styled.button<{ $active?: boolean }>`
  appearance: none;
  text-align: left;
  border: 1px solid
    ${(p) =>
      p.$active ? "rgba(255, 255, 255, 0.22)" : "transparent"};
  background: ${(p) =>
    p.$active ? "rgba(255, 255, 255, 0.08)" : "transparent"};
  color: ${(p) =>
    p.$active ? "#fff" : "rgba(255, 255, 255, 0.7)"};
  border-radius: 8px;
  padding: 0.5rem 0.65rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.06);
  }
`;

const Article = styled.div`
  min-width: 0;
  padding: 1.35rem 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
`;

const Section = styled.section``;

const SectionTitle = styled.h2`
  margin: 0 0 0.85rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.01em;
`;

const Body = styled.div`
  font-size: ${typography.paragraph.fontSize};
  font-weight: ${typography.paragraph.fontWeight};
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.55;

  p {
    margin: 0 0 0.85rem;
  }

  ul {
    margin: 0 0 0.85rem;
    padding-left: 1.2rem;
  }

  li {
    margin-bottom: 0.4rem;
  }

  strong {
    color: rgba(255, 255, 255, 0.95);
    font-weight: 650;
  }

  em {
    font-style: normal;
    color: rgba(255, 255, 255, 0.9);
  }

  a {
    color: rgba(232, 238, 245, 0.95);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

const FooterNote = styled.div`
  margin-top: 1.5rem;
  padding-top: 0.85rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.4);
`;

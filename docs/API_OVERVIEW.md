# API overview

Base URL (local): `http://localhost:4000/api`  
Auth: JWT access token + HTTP-only refresh cookie.

## Module map

| Area | Routes folder | Purpose |
|------|---------------|---------|
| Auth | `modules/auth` | Login, refresh, logout |
| Users / roles | `modules/users` | Role labels, admin user ops |
| Active matches | `modules/active-matches` | Match Workbench list + filters |
| Executive overview | `modules/executive-overview` | Matching overview KPIs / matched opps |
| Discovery | `modules/discovery-engine` | Discover opportunities |
| Companies | `modules/companies` | Company catalog + detail |
| Opportunities | `modules/opportunity` | Opportunity catalog + detail |
| AI / Analytics data | `services/ai-data` | Analytics portal, company/opp MI, chat |
| Match agreement | `services/match-agreement` | Agree / Not a fit verdicts |
| Match comments | `services/match-comment` | Match Case notes |
| Bookmarks | `services/bookmark` | Saved pairs |
| Smart search | `services/smart-search` | Header search |
| Audit | `services/audit` | Audit trail hooks |
| Common data | `services/common-data` | Shared lookups |

## Analytics

`GET` (via ai-data) services compute **live** metrics from MatchingOutput:

- Pursue yield, company pursue coverage, opportunity fill
- Score distribution, decision tier mix
- Sector pursue density / heatmap
- Top pursue pairs and officer brief cards

No static vanity KPIs — empty MatchingOutput yields empty charts.

## Matching data contract

Primary table: `MatchingOutput` (Prisma). Important fields for the UI:

- `decision_tier`, `final_score`, `confidence_score`, `confidence_label`
- `strengths`, `risks`, `recommended_engagement`, `value_chain_position`
- `evidence_flag`, `model_version`

Engine writes these via `matching_v3.py --source db`.

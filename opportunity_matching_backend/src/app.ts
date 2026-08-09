// src\app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import executiveOverviewRoutes from "./modules/executive-overview/executive-overview.routes";
import activeMatchesRoutes from "./modules/active-matches/active-matches.routes";
import discoveryEngineRoutes from "./modules/discovery-engine/discovery-engine.routes";
import companyRoutes from "./modules/companies/company.routes";
import opportunityRoutes from "./modules/opportunity/opportunity.routes";
import aiDataRoutes from './services/ai-data/ai-data.routes';
import smartSearchRoutes from './services/smart-search/smart-search.routes';
import bookmarkRoutes from './services/bookmark/bookmark.routes';
import matchAgreement from './services/match-agreement/match-agreement.routes';
import matchCommentRoutes from './services/match-comment/match-comment.routes';
import commonDataRoutes from './services/common-data/common-data.routes';
import auditRoutes from './services/audit/audit.routes';
import identityProviderRoutes from './modules/identity-provider/identity-provider.routes';
import { errorHandler } from './middlewares/error.middleware';
import logger from './utils/logger';
import pinoHttp from 'pino-http';
import cookieParser from 'cookie-parser';
import 'express-async-errors';

const app = express();

// CRA dev proxy sets X-Forwarded-*; required for express-rate-limit
app.set("trust proxy", 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(express.json());
app.use(cookieParser());

const allowedOrigins: string[] = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Local/dev: reflect any origin (needed for CRA proxy + direct :3000→:4000)
    if (process.env.NODE_ENV !== "production") {
      return callback(null, origin || true);
    }
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, origin || true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(
  rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
  })
);

app.use(pinoHttp({ logger }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use("/api/executive-overview", executiveOverviewRoutes);
app.use("/api/active-matches", activeMatchesRoutes);
app.use("/api/discovery-engine", discoveryEngineRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/ai-data", aiDataRoutes);
app.use("/api/smart-search", smartSearchRoutes);
app.use("/api/bookmark", bookmarkRoutes);
app.use("/api/match-agreement", matchAgreement);
app.use("/api/match-comments", matchCommentRoutes);
app.use("/api/common-data", commonDataRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/identity-provider", identityProviderRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

export default app;
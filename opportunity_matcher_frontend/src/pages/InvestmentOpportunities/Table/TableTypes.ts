// types.ts
export interface InvestmentTableData {
  id: number;
  opportunity: string;
  description: string;
  sector: string;
  sectorColor: string;
  overallScore: number;
  investmentAppeal: number;
  economicImpact: number;
  marketReady: number;
  innovation: number;
  investmentSize: string;
  jobsCreated: string;

   // grid extras
  score?: number;
  tag?: string;
  stats?: {
    investment: string;
    jobs: string;
    irr: string;
  };
}

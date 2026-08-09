import axiosClient from '../../api/axiosClient';
import { OpportunityDetailsResponse } from '../types/opportunitiesDetailsTypes';

export const getOpportunityDetails = async (
  opportunityId: number,
  aiDecision?: string
): Promise<OpportunityDetailsResponse> => {
  let url = `/opportunities/${opportunityId}`;

  if (aiDecision) {
    url += `?ai_decision=${aiDecision}`;
  }

  const response = await axiosClient.get(url);
  return response.data;
};
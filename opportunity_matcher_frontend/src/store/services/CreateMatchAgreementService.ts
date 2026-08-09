import axiosClient from "../../api/axiosClient";
import { CreateMatchAgreementRequest, MatchAgreementResponse } from "../types/CreateMatchAgreementTypes";

export const matchAgreementService = {
  createMatchAgreement: async (requestData: CreateMatchAgreementRequest): Promise<MatchAgreementResponse> => {
    const response = await axiosClient.post<MatchAgreementResponse>("/match-agreement", requestData);
    return response.data;
  },
};
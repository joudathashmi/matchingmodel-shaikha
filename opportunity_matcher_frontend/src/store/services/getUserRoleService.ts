import axiosClient from "../../api/axiosClient";
import { UserResponse } from "../types/getUserRoleTypes";

export const getUserRoleService = {
  getUser: async (): Promise<UserResponse> => {
    const response = await axiosClient.get<UserResponse>("/users/me");
    return response.data;
  },
};
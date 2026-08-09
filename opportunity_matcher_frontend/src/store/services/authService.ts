import axiosClient from "../../api/axiosClient";
import { LoginResponse } from "../types/authTypes";

// services/authServices.ts
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await axiosClient.post("/auth/login", { email, password });
    return response.data;
  } catch (error: any) {
    // Re-throw the error with proper message
    if (error.response?.status === 401) {
      throw new Error("Invalid email or password");
    } else if (error.response?.status === 404) {
      throw new Error("Email not registered");
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error("Login failed. Please try again later.");
    }
  }
};
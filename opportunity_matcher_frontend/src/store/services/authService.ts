import axiosClient from "../../api/axiosClient";
import { LoginResponse } from "../types/authTypes";

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await axiosClient.post("/auth/login", { email, password });
    return response.data;
  } catch (error: any) {
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

export const forgotPassword = async (email: string) => {
  const response = await axiosClient.post("/auth/forgot-password", { email });
  return response.data as {
    message: string;
    resetUrl?: string;
    expiresAt?: string;
  };
};

export const resetPassword = async (token: string, password: string) => {
  const response = await axiosClient.post("/auth/reset-password", {
    token,
    password,
  });
  return response.data as { message: string };
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
) => {
  const response = await axiosClient.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data as {
    message: string;
    mustChangePassword: boolean;
    user: { id: string; email: string; name?: string | null };
  };
};

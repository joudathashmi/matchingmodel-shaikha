import axiosClient from "../../api/axiosClient";


export const logout = async (): Promise<{ message: string }> => {
  const response = await axiosClient.post('/auth/logout');
  return response.data;
};
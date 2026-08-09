import axiosClient from "../../api/axiosClient";

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
};

export type RoleCatalogItem = {
  name: string;
  description: string;
};

export type CreateUserInput = {
  email: string;
  password: string;
  name?: string;
  role?: string;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  password?: string;
};

export const usersAdminService = {
  listUsers: async (): Promise<AdminUser[]> => {
    const res = await axiosClient.get<{ users: AdminUser[] }>("/users/all");
    return res.data.users;
  },

  listRoles: async (): Promise<RoleCatalogItem[]> => {
    const res = await axiosClient.get<{ roles: RoleCatalogItem[] }>("/users/roles");
    return res.data.roles;
  },

  setUserRole: async (userId: string, role: string): Promise<AdminUser> => {
    const res = await axiosClient.patch<{ user: AdminUser }>(
      `/users/${userId}/role`,
      { role }
    );
    return res.data.user;
  },

  createUser: async (input: CreateUserInput): Promise<AdminUser> => {
    const res = await axiosClient.post<{ user: AdminUser }>("/users", input);
    return res.data.user;
  },

  updateUser: async (
    userId: string,
    input: UpdateUserInput
  ): Promise<AdminUser> => {
    const res = await axiosClient.patch<{ user: AdminUser }>(
      `/users/${userId}`,
      input
    );
    return res.data.user;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await axiosClient.delete(`/users/${userId}`);
  },
};

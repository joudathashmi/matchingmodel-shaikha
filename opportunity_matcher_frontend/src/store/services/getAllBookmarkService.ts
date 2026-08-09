import axiosClient from '../../api/axiosClient';

export const bookmarkService = {
  getAllBookmarks: async (): Promise<any> => {
    try {
      const response = await axiosClient.get('/bookmark');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch bookmarks');
    }
  }
};
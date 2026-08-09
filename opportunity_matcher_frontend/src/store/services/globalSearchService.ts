import axiosClient from "../../api/axiosClient";

export interface SearchResult {
  id: number;
  type: "company" | "opportunity" | "sector";
  name: string;
  extra: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}

export const globalSearchService = {
  search: async (query: string): Promise<SearchResponse> => {
    try {
      const response = await axiosClient.get(
        `/smart-search/services?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Global search failed:", error);
      throw error;
    }
  },
};

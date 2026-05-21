
import { NewsType } from "types";
import networkCheck from "./networkCheck";

export interface NewsResponse {
  data: NewsType[];
  total: number;
}
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const newsApi = {
  getNews: async (
    accessToken: string,
    skip: number,
    limit: number
  ): Promise<NewsResponse> => {
    const res = await networkCheck.get(`${API_BASE_URL}/worker/news`, {
      params: { skip, limit },
      headers: { Authorization: `Aoser ${accessToken}` },
    });
    return res.data;
  },

    getNewsDetail: async (accessToken: string, newsId: string): Promise<NewsType> => {
      const res = await networkCheck.get(`${API_BASE_URL}/worker/news/${newsId}`, {
        headers: { Authorization: `Aoser ${accessToken}` },
      });
      return res.data.data;
    }

};
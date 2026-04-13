import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { useAuth } from "./useAuth";
import { newsApi } from "api/newsApi";

const LIMIT = 10;


export const useNews = () => {
  const { tokens } = useAuth();

  return useInfiniteQuery({
    queryKey: ["newsScreen"],
    queryFn: ({ pageParam = 0 }) =>
      newsApi.getNews(tokens?.accessToken ?? "", pageParam, LIMIT),
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.flatMap((p) => p.data).length;
      return fetched < lastPage.total ? fetched : undefined;
    },
    initialPageParam: 0,
    enabled: !!tokens?.accessToken,
    staleTime: 1000 * 60 * 5,
  });
};

//get new detail
const useNewsDetail = (newsId: string) => {
  const { tokens } = useAuth();
  return useQuery({
    queryKey: ['news', newsId],
    queryFn: () => newsApi.getNewsDetail(tokens?.accessToken ?? "", newsId),
    // enabled: !!tokens?.accessToken && !!newsId,
    staleTime: 1000 * 60 * 5,
  });
};

export default useNewsDetail;


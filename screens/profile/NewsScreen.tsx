import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  Image,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useNews } from "hooks/useNews";
import { NewsType } from "types";
import ScreenWrapper from "components/ui/ScreenWrapper";
import Header_back from "components/ui/Header_back";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FreelancerStackParamList } from "types/navigation";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("lo-LA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));

// ─── NewsCard ─────────────────────────────────────────────────────────────────

const NewsCard = React.memo(({ item }: { item: NewsType }) => {
  const hasImage = !!item.image;
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

  return (
    <Pressable className="mb-4" onPress={() => navigation.navigate("News", { newsId: item._id })}>

      <View className="bg-surface rounded-2xl border border-border overflow-hidden " style={{ shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}>
        {/* Image */}
        {/* {hasImage ? (
        <Image
          source={{ uri: item.image }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.cardImagePlaceholder} className="bg-blue-50 items-center justify-center">
          <Ionicons name="newspaper-outline" size={40} color="#3B82F6" />
        </View>
      )} */}

        {/* Content */}
        <View className="p-4">
          <Text
            className="text-body font-bold text-text mb-1"
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text
            className="text-caption text-textSecondary leading-5"
            numberOfLines={3}
          >
            {item.detail}
          </Text>

          {/* Footer */}
          <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border">
            <View className="flex-row items-center gap-1">
              <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
              <Text className="text-caption text-textSecondary">
                {formatDate(item.createdAt)}
              </Text>
            </View>
            {/* <View
            className={`px-2 py-0.5 rounded-full ${item.isPublished ? "bg-green-50" : "bg-gray-100"
              }`}
          >
            <Text
              className={`text-caption font-semibold ${item.isPublished ? "text-green-700" : "text-gray-500"
                }`}
            >
              {item.isPublished ? "Published" : "Draft"}
            </Text>
          </View> */}
          </View>
        </View>
      </View>
    </Pressable>
  );
});

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyView = () => (
  <View className="flex-1 items-center justify-center py-20 px-6">
    <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-4">
      <Ionicons name="newspaper-outline" size={40} color="#3B82F6" />
    </View>
    <Text className="text-h3 font-bold text-text text-center mb-2">
      No news yet
    </Text>
    <Text className="text-body text-textSecondary text-center max-w-[260px]">
      There are no announcements at the moment. Check back later.
    </Text>
  </View>
);

// ─── Footer loader ────────────────────────────────────────────────────────────

const FooterLoader = () => (
  <View className="py-6 items-center justify-center">
    <ActivityIndicator size="small" color="#3B82F6" />
  </View>
);

// ─── NewsScreen ───────────────────────────────────────────────────────────────

const NewsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useNews();

  const allNews = data?.pages.flatMap((page) => page.data) ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const keyExtractor = useCallback((item: NewsType) => item._id, []);

  const renderItem = useCallback(
    ({ item }: { item: NewsType }) => <NewsCard item={item} />,
    []
  );

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <ScreenWrapper safeEdges={["top", "bottom"]} style={{ flex: 1 }}>
        <Header_back text={t("news.title")} iconColor="#3B82F6" onPress={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </ScreenWrapper>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <ScreenWrapper safeEdges={["top", "bottom"]} style={{ flex: 1 }}>
        <Header_back text={t("news.title")} iconColor="#3B82F6" onPress={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center px-6 gap-4">
          <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
          <Text className="text-body text-error text-center">
            {t("news.errorLoading")}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="bg-primary px-6 py-3 rounded-full"
          >
            <Text className="text-surface text-body font-semibold">
              {t("common.retry")}
            </Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper safeEdges={["top", "bottom"]} style={{ flex: 1 }}>
      <Header_back text={t("news.title")} iconColor="#3B82F6" onPress={() => navigation.goBack()} />

      <FlatList
        data={allNews}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          allNews.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={<EmptyView />}
        ListFooterComponent={isFetchingNextPage ? <FooterLoader /> : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  cardImage: {
    width: "100%",
    height: 180,
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 140,
  },
});

export default NewsScreen;
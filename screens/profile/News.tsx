import React, { useMemo } from "react";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import ScreenWrapper from "components/ui/ScreenWrapper";
import Header_back from "components/ui/Header_back";
import useNewsDetail from "hooks/useNews";
import type { FreelancerStackParamList } from "types/navigation";
import { formatDisplayDateTime } from "utils/dateFormatter";

type NewsRouteProp = RouteProp<FreelancerStackParamList, "News">;
type Nav = NativeStackNavigationProp<FreelancerStackParamList>;



const BASE_IMAGE = process.env.EXPO_PUBLIC_IMAGES_URL;

const News = () => {
  const { t } = useTranslation();
  const headerTitle = t("protectedRoute.back");
  const navigation = useNavigation<Nav>();
  const route = useRoute<NewsRouteProp>();
  const newsId = route.params?.newsId;

  const { data: news, isLoading, isError, refetch, isRefetching } = useNewsDetail(newsId);


  console.log("News detail data:", news);   
  if (!newsId) {
    return (
      <ScreenWrapper safeEdges={["top", "bottom"]} style={{ flex: 1 }}>
        <Header_back text={headerTitle} iconColor="#3B82F6" onPress={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center px-6 gap-3">
          <Ionicons name="alert-circle-outline" size={44} color="#EF4444" />
          <Text className="text-body text-error text-center">
            {t("news.invalidId", { defaultValue: "Invalid news id." })}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (isLoading) {
    return (
      <ScreenWrapper safeEdges={["top", "bottom"]} style={{ flex: 1 }}>
        <Header_back text={headerTitle} iconColor="#3B82F6" onPress={() => navigation.goBack()} />
        <View className="flex-1 justify-center items-center bg-background">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </ScreenWrapper>
    );
  }

  if (isError || !news) {
    return (
      <ScreenWrapper safeEdges={["top", "bottom"]} style={{ flex: 1 }}>
        <Header_back text={headerTitle} iconColor="#3B82F6" onPress={() => navigation.goBack()} />
        <View className="flex-1 justify-center items-center bg-background p-6 gap-4">
          <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
          <Text className="text-body text-error text-center">
            {t("news.errorLoadingDetail", { defaultValue: "Error loading news details." })}
          </Text>
          <Pressable
            onPress={() => refetch()}
            disabled={isRefetching}
            className={`bg-primary px-6 py-3 rounded-full ${isRefetching ? "opacity-60" : ""}`}
          >
            <Text className="text-surface text-body font-semibold">
              {isRefetching
                ? t("common.loading", { defaultValue: "Loading..." })
                : t("common.retry", { defaultValue: "Retry" })}
            </Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper safeEdges={["top", "bottom"]} style={{ flex: 1 }}>
      <Header_back text={headerTitle} iconColor="#3B82F6" onPress={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Image */}
        {news.image ? (
          <Image source={{ uri: BASE_IMAGE+ news.image }} className="w-full h-64 bg-border" resizeMode="cover" />
        ) : (
          <View className="w-full h-64 bg-blue-50 items-center justify-center">
            <Ionicons name="newspaper-outline" size={56} color="#3B82F6" />
          </View>
        )}

        <View className="p-5 bg-surface rounded-t-3xl -mt-6 flex-1 border border-border">
        

          <Text className="text-subheading text-text mb-4">{news.title}</Text>

          <View className="h-[1px] bg-border mb-4" />

          <Text className="text-body text-textSecondary leading-6">{news.detail}</Text>

          <View className="mt-10 pt-4 border-t border-border">
            <Text className="text-caption text-textSecondary">
              {t("news.lastUpdated")}: {formatDisplayDateTime(news.updatedAt)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default News;

import React from "react";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import ScreenWrapper from "components/ui/ScreenWrapper";
import { useGetWallet } from "hooks/usePublicWork";
import { FreelancerStackParamList } from "types/navigation";
import Header_back from "components/ui/Header_back";

type WalletCurrency = "LAK" | "USD";
const CURRENCIES: WalletCurrency[] = ["LAK", "USD"];

const WalletScreen = () => {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<FreelancerStackParamList, "WalletScreen">>();
  const userId = route.params?.userId;
  const navigation = useNavigation();
  const { data, isLoading, isError, refetch } = useGetWallet(userId);

  const availableCurrencies = React.useMemo<WalletCurrency[]>(() => {
    if (!data?.earnings) return ["LAK"];
    return CURRENCIES.filter((c) => Boolean(data.earnings?.[c]));
  }, [data?.earnings]);

  const initialCurrency = React.useMemo<WalletCurrency>(() => {
    const lak = data?.earnings?.LAK?.totalRevenue ?? 0;
    const usd = data?.earnings?.USD?.totalRevenue ?? 0;
    if (lak > 0) return "LAK";
    if (usd > 0) return "USD";
    return availableCurrencies[0] ?? "LAK";
  }, [availableCurrencies, data?.earnings?.LAK?.totalRevenue, data?.earnings?.USD?.totalRevenue]);

  const [currency, setCurrency] = React.useState<WalletCurrency>(initialCurrency);
  React.useEffect(() => {
    setCurrency(initialCurrency);
  }, [initialCurrency]);

  if (isLoading) {
    return (
      <ScreenWrapper safeEdges={["top", "bottom"]} style={{ flex: 1 }}>
        <Header_back text={t("wallet.title")} iconColor="#3B82F6" onPress={() => navigation.goBack()} />

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </ScreenWrapper>
    );
  }

  if (isError || !data?.earnings) {
    return (
      <ScreenWrapper safeEdges={["top", "bottom"]} style={{ flex: 1 }}>
        <Header_back text={t("wallet.title")} iconColor="#3B82F6" onPress={() => navigation.goBack()} />

        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-body text-textSecondary text-center">
            {t("wallet.errorLoading")}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="bg-primary px-8 py-4 rounded-xl mt-4 flex-row items-center active:opacity-80"
          >
            <Text className="text-white font-semibold text-body">
              {t('works.error.try_again')}
            </Text>
          </Pressable>
        </View>

      </ScreenWrapper>
    );
  }

  const e = data.earnings[currency] ?? data.earnings.LAK ?? data.earnings.USD;

  const stats = [
    { label: t("wallet.stats.totalWorks"), value: data.totalWorks, icon: "list-outline" },
    { label: t("wallet.stats.completed"), value: data.totalCompletedWork, icon: "checkmark-circle-outline" },
    { label: t("wallet.stats.processing"), value: data.totalProcessingWork, icon: "time-outline" },
    { label: t("wallet.stats.awaitingClaim"), value: data.totalAwaitingClaimWork, icon: "cash-outline" },
    { label: t("wallet.stats.claimComplete"), value: data.totalClaimCompleteWork, icon: "flag-outline" },
  ];

  const breakdown = [
    { label: t("wallet.breakdown.workCost"), value: e?.totalWorkCost ?? 0, dot: "bg-primary" },
    { label: t("wallet.breakdown.appendWorkCost"), value: e?.totalAppendWorkCost ?? 0, dot: "bg-primary" },
    { label: t("wallet.breakdown.awaitingClaim"), value: e?.totalAwaitingClaimWorkCost ?? 0, dot: "bg-warning" },
    { label: t("wallet.breakdown.awaitingAppend"), value: e?.totalAwaitingClaimAppendWorkCost ?? 0, dot: "bg-warning" },
    { label: t("wallet.breakdown.claimedComplete"), value: e?.totalClaimCompleteWorkCost ?? 0, dot: "bg-success" },
    { label: t("wallet.breakdown.claimedAppend"), value: e?.totalClaimCompleteAppendWorkCost ?? 0, dot: "bg-success" },
  ];

  return (
    <ScreenWrapper safeEdges={["top", "bottom"]} style={{ flex: 1 }}>
      <Header_back text={t("wallet.title")} iconColor="#3B82F6" onPress={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-5 pt-4 pb-8">
          {availableCurrencies.length > 1 && (
            <View className="self-start flex-row bg-white/15 rounded-full p-1 mb-4 border border-white/20">
              {availableCurrencies.map((c) => {
                const active = c === currency;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCurrency(c)}
                    className={`px-4 py-2 rounded-full ${active ? "bg-white/25" : ""}`}
                  >
                    <Text className={`text-caption ${active ? "text-surface" : "text-white/70"}`}>
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Balance card */}
          <View className="bg-white/15 rounded-2xl p-5 border border-white/25">
            <Text className="text-body text-white/70 tracking-wide mb-1">
              {t("wallet.totalRevenue")}
            </Text>
            <View className="flex-row items-end gap-2">
              <Text className="text-subheading text-white">{currency}</Text>
              <Text className="text-heading text-surface mb-1" style={{ fontSize: 32 }}>
                {new Intl.NumberFormat().format(e?.totalRevenue ?? 0)}
              </Text>
            </View>

            <View className="flex-row mt-4 gap-3">
              {[
                { label: t("wallet.claimed"), value: e?.totalClaimCompleteCost ?? 0 },
                { label: t("wallet.awaitingClaim"), value: e?.totalAwaitingClaimCost ?? 0 },
                { label: t("wallet.processing"), value: e?.totalProcessingWorkCost ?? 0 },
              ].map((item, i, arr) => (
                <React.Fragment key={item.label}>
                  <View className="flex-1">
                    <Text className="text-caption text-white/60 mb-1 text-center">{item.label}</Text>
                    <Text className="text-body text-surface font-semibold text-center">
                      {new Intl.NumberFormat().format(item.value)}
                    </Text>
                  </View>
                  {i < arr.length - 1 && <View className="w-px bg-white/25" />}
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>

        <View className="p-5 gap-4">
          {/* Stats grid */}
          <View>
            <Text className="text-body text-text tracking-wide mb-3">
              {t("wallet.workOverview")}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {stats.map((item) => (
                <View
                  key={item.label}
                  className="bg-surface rounded-xl border border-border p-4"
                  style={{ width: "49%" }}
                >
                  <View className="mb-2">
                    <Ionicons name={item.icon as any} size={20} color="#6B7280" />
                  </View>
                  <Text className="text-heading text-primary" style={{ fontSize: 24 }}>
                    {item.value}
                  </Text>
                  <Text className="text-caption text-textSecondary mt-1">{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Earnings breakdown */}
          <View>
            <Text className="text-body text-text tracking-wide mb-3">
              {t("wallet.earningsBreakdown")} - {currency}
            </Text>
            <View className="bg-surface rounded-xl border border-border">
              {breakdown.map((item, index, arr) => (
                <View
                  key={item.label}
                  className={`flex-row justify-between items-center px-4 py-3 ${index < arr.length - 1 ? "border-b border-border" : ""
                    }`}
                >
                  <View className="flex-row items-center gap-2">
                    <View className={`w-2 h-2 rounded-full ${item.dot}`} />
                    <Text className="text-body text-textSecondary">{item.label}</Text>
                  </View>
                  <Text className="text-body text-text font-semibold">
                    {new Intl.NumberFormat().format(item.value)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default WalletScreen;
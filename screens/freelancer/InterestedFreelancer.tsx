import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { ALERT_TYPE, Toast } from "react-native-alert-notification";

import type { WorkById } from "types";
import ProfileOn_InterestedMyView from "components/profile/ProfileOn_InterestedMyView";
import BudgetInput from "components/ui/BudgetInput";
import TextArea from "components/ui/TextArea";
import { useFreelancerApplyWork, useFreeLRequestUpdateW } from "hooks/usePublicWork";
import { useMyProfile } from "hooks/useFreelancer";

type BudgetCurrency = "LAK" | "USD";

type ApplicantLike = {
  applicant?: { _id?: string } | string;
};

const getApplicantId = (applicant: ApplicantLike) => {
  const value = applicant?.applicant;
  if (!value) return undefined;
  return typeof value === "string" ? value : value._id;
};

interface InterestedFreelancerProps {
  visible: boolean;
  onClose: () => void;
  jobs: WorkById | null;
  user?: { _id?: string } | any;
  refetch: () => void;
  onUserPress: (userId: string) => void;
  isFreelancer: boolean;
}

const InterestedFreelancer = ({
  visible,
  onClose,
  jobs,
  refetch,
  onUserPress,
  isFreelancer,
  user,
}: InterestedFreelancerProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const presentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sheetIndex, setSheetIndex] = useState(-1);

  const { data: myProfile } = useMyProfile();
  const freeLRequestUpdateWMutation = useFreeLRequestUpdateW();
  const applyWorkMutation = useFreelancerApplyWork();

  const job = jobs;
  const applicants = job?.applicant ?? [];
  const myUserId = myProfile?._id ?? user?._id;
  const isOwner = !!(myUserId && job?.work?.createdBy?._id && myUserId === job.work.createdBy._id);

  const hasApplied = useMemo(() => {
    if (!myUserId) return false;
    return applicants.some((a: any) => getApplicantId(a) === myUserId);
  }, [applicants, myUserId]);

  const canApply =
    !!myProfile &&
    myProfile.businessType === "FREELANCER" &&
    myProfile.registrationStatus === "APPROVED_COMPLETE" &&
    !isOwner;

  const showApplyButton = canApply && !hasApplied;

  // Offering form (optional)
  const [reason, setReason] = useState("");
  const [budgetOffer, setBudgetOffer] = useState(0);
  const [budgetCurrency, setBudgetCurrency] = useState<BudgetCurrency>("LAK");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedReason = reason.trim();
  const hasReason = trimmedReason.length > 0;
  const hasBudget = (budgetOffer || 0) > 0;
  const offeringIsPartial = (hasReason && !hasBudget) || (!hasReason && hasBudget);
  const showReasonError = offeringIsPartial && !hasReason;
  const showBudgetError = offeringIsPartial && !hasBudget;

  const resetForm = useCallback(() => {
    setReason("");
    setBudgetOffer(0);
    setBudgetCurrency("LAK");
    setIsSubmitting(false);
  }, []);

  // Present/dismiss modal (full screen)
  useEffect(() => {
    if (!job) return;

    if (presentTimeoutRef.current) clearTimeout(presentTimeoutRef.current);
    presentTimeoutRef.current = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        if (visible) bottomSheetModalRef.current?.present();
        else bottomSheetModalRef.current?.dismiss();
      });
    }, 50);

    return () => {
      if (presentTimeoutRef.current) clearTimeout(presentTimeoutRef.current);
    };
  }, [visible, job?.work?._id]);

  // Android back button closes the sheet
  useEffect(() => {
    const onBackPress = () => {
      if (sheetIndex >= 0) {
        bottomSheetModalRef.current?.dismiss();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => backHandler.remove();
  }, [sheetIndex]);

  const handleDismiss = useCallback(() => {
    resetForm();
    setSheetIndex(-1);
    onClose();
  }, [onClose, resetForm]);

  const handleApply = useCallback(async () => {
    if (!job?.work?._id) return;
    if (isSubmitting) return;

    // both empty is OK (no offering). If one is provided, require both.
    if (offeringIsPartial) {
      Toast.show({
        type: ALERT_TYPE.WARNING,
        title: t("common.warning") || "Warning",
        textBody: t("chat.offer.fill_both_fields") || "Please fill both budget and description for your offering.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (hasReason && hasBudget) {
        await freeLRequestUpdateWMutation.mutateAsync({
          id: job.work._id,
          data: {
            reason: trimmedReason,
            updateData: { budget: budgetOffer, currency: budgetCurrency },
          },
        });
      }

      await applyWorkMutation.mutateAsync({ workId: job.work._id });
      await refetch();

      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: t("common.success") || "Success",
      });
      onClose();
    } catch (applyError) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: t("common.error") || "Failed",
        textBody: t("profile_in_command.apply_failed") || "Failed to apply for this work. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    applyWorkMutation,
    budgetCurrency,
    budgetOffer,
    freeLRequestUpdateWMutation,
    hasBudget,
    hasReason,
    isSubmitting,
    job?.work?._id,
    offeringIsPartial,
    refetch,
    t,
    trimmedReason,
  ]);

  const snapPoints = useMemo(() => ["100%"], []);

  if (!job) return null;

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      onChange={setSheetIndex}
      onDismiss={handleDismiss}
      enablePanDownToClose
      backgroundStyle={styles.modalBackground}
      handleIndicatorStyle={styles.handleIndicator}
      topInset={insets.top}
      android_keyboardInputMode="adjustResize"
      backdropComponent={({ style }) => (
        <TouchableWithoutFeedback onPress={() => bottomSheetModalRef.current?.dismiss()}>
          <View style={[style, styles.backdrop]} />
        </TouchableWithoutFeedback>
      )}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 60 : 0}
      >
        <BottomSheetScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          contentContainerStyle={{
            paddingBottom: showApplyButton ? insets.bottom + 100 : insets.bottom + 24,
          }}
        >
          <View className="bg-gray-200 w-full h-[1px] mb-4" />

          {/* Owner view */}
          {isOwner && applicants.length === 0 && (
            <>
              <Text className="text-body font-bold text-text mb-4">
                {t("works.interestedFreelancers.title")}
              </Text>

              <View className="flex-1 items-center justify-center py-12 px-6">
                <View className="w-24 h-24 rounded-full bg-blue-50 items-center justify-center mb-4">
                  <Ionicons name="people-outline" size={48} color="#3B82F6" />
                </View>

                <Text className="text-h3 font-bold text-text text-center mb-2">
                  {t("works.interestedFreelancers.empty.title")}
                </Text>

                <Text className="text-body text-textSecondary text-center mb-6 max-w-[280px]">
                  {t("works.interestedFreelancers.empty.description")}
                </Text>

                <View className="mt-2 bg-blue-50 rounded-xl p-4 w-full">
                  <View className="flex-row items-start gap-3">
                    <Ionicons name="bulb-outline" size={20} color="#3B82F6" />
                    <View className="flex-1">
                      <Text className="text-caption font-semibold text-text mb-1">
                        {t("works.interestedFreelancers.empty.tip.title")}
                      </Text>
                      <Text className="text-caption text-textSecondary">
                        {t("works.interestedFreelancers.empty.tip.description")}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}

          {isOwner && applicants.length > 0 && (
            <View className="flex-1">
              <Text className="text-body font-bold text-text mb-4 px-4">
                {t("works.interestedFreelancers.title")}
              </Text>
              <ProfileOn_InterestedMyView
                job={job}
                handleUserProfileNavigation={onUserPress}
                onClose={() => bottomSheetModalRef.current?.dismiss()}
                refetch={refetch}
                isFreelancer={isFreelancer}
              />
            </View>
          )}

          {/* Non-owner (freelancer) offering */}
          {!isOwner && (
            <>
              <Text className="text-body font-bold text-text mb-4 px-4">{t("chat.offer.your_offering")}</Text>

              {hasApplied ? (
                <View className="bg-blue-50 border border-border rounded-xl p-4 mb-2 mx-4">
                  <Text className="text-body text-text">
                    {t("workDetail.already_applied") || "You already applied for this job."}
                  </Text>
                </View>
              ) : (
                <View className="px-4">
                  <BudgetInput
                    label={t("postWork.budget")}
                    value={budgetOffer}
                    onChange={(value) => setBudgetOffer(Math.max(0, value || 0))}
                    currency={budgetCurrency}
                    onCurrencyChange={setBudgetCurrency}
                    error={showBudgetError}
                    isValidate={showBudgetError ? t("postWork.budget_required") : ""}
                  />

                  <View className="mt-2">
                    <TextArea
                      label={t("postWork.work_description")}
                      placeholder={t("postWork.work_description_placeholder")}
                      value={reason}
                      onChangeText={setReason}
                      inputClassName={showReasonError ? "border-error" : "border-border"}
                      isValidate={showReasonError ? t("postWork.work_description_required") : ""}
                    />
                  </View>
                </View>
              )}
            </>
          )}
        </BottomSheetScrollView>
      </KeyboardAvoidingView>

      {showApplyButton && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: insets.bottom + 24,
            backgroundColor: "transparent",
          }}
        >
          <TouchableOpacity
            onPress={handleApply}
            disabled={isSubmitting || offeringIsPartial}
            className={`bg-primary p-4 mx-4 rounded-full shadow-md ${
              isSubmitting || offeringIsPartial ? "opacity-60" : ""
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <View className="flex-row gap-2 items-center justify-center">
                <Text className="text-surface">{t("workDetail.apply_now")}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: "#9CA3AF",
    width: 40,
    height: 4,
  },
  backdrop: {
    backgroundColor: "#0000006f",
  },
});

export default InterestedFreelancer;


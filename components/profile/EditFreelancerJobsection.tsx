import React, { useEffect, useRef, useState } from 'react';
import {
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import FormInput from 'components/ui/Input';
import SelectInput from 'components/ui/SelectInput';
import { useFreelancerById, useMyProfile, useUpdateMyProfile } from 'hooks/useFreelancer';
import SelectImage from 'components/ui/SelectImage';
import SelectVideo from 'components/ui/SelectVideo';
import SelectFreelancerType from 'components/ui/SelectfreelancerType';
import { FileWithType } from 'types';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import { ScrollView } from 'react-native-gesture-handler';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getPresignedUrls, uploadFileToUrl } from 'api/uploadUtils';

import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { useTranslation } from 'react-i18next';

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;

const EditFreelancerJobsection = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { t } = useTranslation();

    const [jobTitle, setJobTitle] = useState('');
    const [freelancerType, setFreelancerType] = useState('FULLTIME');
    const [category, setCategory] = useState('');
    const [subcategories, setSubcategories] = useState<string[]>([]);
    const [errors, setErrors] = useState({
        jobTitle: false,
        category: false,
        bannerImage: false,
        freelancerType: false,
    });
    const [isUploading, setIsUploading] = useState(false);

    // ── Banner image ─────────────────────────────────────────────────────────
    // Separate display URI (shown in SelectImage) from the new file to upload
    const [bannerImageDisplayUri, setBannerImageDisplayUri] = useState<string>('');
    const [bannerImageFile, setBannerImageFile] = useState<FileWithType | null>(null);

    // ── Promo video ──────────────────────────────────────────────────────────
    // Separate display URI (passed to SelectVideo) from the new file to upload.
    // This prevents SelectVideo from re-triggering player.replaceAsync every
    // time something unrelated in the parent re-renders.
    const [promoVideoDisplayUri, setPromoVideoDisplayUri] = useState<string>('');
    const [promoteVideoFile, setPromoteVideoFile] = useState<FileWithType | null>(null);

    const categoryRef = useRef<{ focus: () => void }>(null);
    const { data } = useMyProfile();
    const { data: profile, isLoading } = useFreelancerById(data?._id || '');
    const { mutate: updateProfile, isPending: isUpdating } = useUpdateMyProfile();

    // Populate form from existing profile (runs once when profile loads)
    useEffect(() => {
        if (profile) {
            console.log('sub ----: ', profile.jobs);
            setJobTitle(profile.jobTitle || '');
            setBannerImageDisplayUri(
                profile.bannerImage ? `${IMAGES_BASE_URL}${profile.bannerImage}` : ''
            );
            setPromoVideoDisplayUri(
                profile.videoPromote ? `${IMAGES_BASE_URL}${profile.videoPromote}` : ''
            );
            setFreelancerType(profile.freelancerType || '');
            setCategory(profile.serviceType || '');
            setSubcategories(profile.jobs || []);
        }
    }, [profile]);

    // ── Image change handler ──────────────────────────────────────────────────
    const handleImageChange = (file?: FileWithType) => {
        if (file) {
            setBannerImageFile(file);
            setBannerImageDisplayUri(file.uri); // show local preview
        } else {
            setBannerImageFile(null);
            setBannerImageDisplayUri('');
        }
    };

    // ── Video change handler ──────────────────────────────────────────────────
    // Key fix: update promoVideoDisplayUri so SelectVideo receives the new URI
    // and reloads the player — but only when a new file is actually picked.
    const promoteVideoChange = (file?: FileWithType) => {
        if (file) {
            setPromoteVideoFile(file);
            setPromoVideoDisplayUri(file.uri); // triggers player reload in SelectVideo
        } else {
            setPromoteVideoFile(null);
            setPromoVideoDisplayUri('');
        }
    };

    // ── Upload helper ─────────────────────────────────────────────────────────
    const uploadFiles = async (): Promise<{ bannerUrl: string; videoUrl: string }> => {
        let bannerUrl = bannerImageDisplayUri;
        let videoUrl = promoVideoDisplayUri;

        setIsUploading(true);
        try {
            const filesToUpload: { name: string; type: string }[] = [];

            if (bannerImageFile) {
                filesToUpload.push({ name: bannerImageFile.name, type: bannerImageFile.type });
            }
            if (promoteVideoFile) {
                filesToUpload.push({ name: promoteVideoFile.name, type: promoteVideoFile.type });
            }

            // Helper: strip full URL down to just the filename stored in DB
            const extractFilename = (url: string): string => {
                if (url.includes('/uploads/')) {
                    return url.substring(url.indexOf('/uploads/') + '/uploads/'.length);
                }
                if (!url.startsWith('file://')) {
                    return url.replace('/uploads/', '');
                }
                return url;
            };

            if (filesToUpload.length === 0) {
                // No new files — just normalise the existing URLs to filenames
                return {
                    bannerUrl: extractFilename(bannerUrl),
                    videoUrl: extractFilename(videoUrl),
                };
            }

            const presignedUrls = await getPresignedUrls(filesToUpload);
            console.log('Presigned URLs:', presignedUrls);

            let urlIndex = 0;

            if (bannerImageFile) {
                await uploadFileToUrl(
                    presignedUrls[urlIndex].url,
                    bannerImageFile.uri,
                    presignedUrls[urlIndex].contentType,
                );
                const fullUrl = presignedUrls[urlIndex].url.split('?')[0];
                bannerUrl = fullUrl
                    .substring(fullUrl.indexOf('/uploads/'))
                    .replace('/uploads/', '');
                urlIndex++;
            } else {
                bannerUrl = extractFilename(bannerUrl);
            }

            if (promoteVideoFile) {
                await uploadFileToUrl(
                    presignedUrls[urlIndex].url,
                    promoteVideoFile.uri,
                    presignedUrls[urlIndex].contentType,
                );
                const fullUrl = presignedUrls[urlIndex].url.split('?')[0];
                videoUrl = fullUrl
                    .substring(fullUrl.indexOf('/uploads/'))
                    .replace('/uploads/', '');
            } else {
                videoUrl = extractFilename(videoUrl);
            }

            console.log('Files uploaded successfully');
            console.log('Final filenames:', { bannerUrl, videoUrl });
            return { bannerUrl, videoUrl };
        } catch (error) {
            console.log('Upload error:', error);
            throw new Error('Failed to upload files');
        } finally {
            setIsUploading(false);
        }
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleUpdate = async () => {
        const newErrors = {
            jobTitle: !jobTitle.trim(),
            category: !category,
            bannerImage: !bannerImageDisplayUri,
            freelancerType: !freelancerType,
        };
        setErrors(newErrors);

        if (Object.values(newErrors).some(Boolean)) return;

        try {
            const { bannerUrl, videoUrl } = await uploadFiles();

            const updateData = {
                jobTitle,
                bannerImage: bannerUrl,
                videoPromote: videoUrl,
                freelancerType,
                serviceType: category,
                jobs: subcategories,
            };

            console.log('updateData', updateData);

            updateProfile(updateData, {
                onSuccess: () => {
                    Toast.show({
                        type: ALERT_TYPE.SUCCESS,
                        title: t('kyc.toast.success.title'),
                        textBody: t('kyc.toast.success.onupdate'),
                    });
                    navigation.goBack();
                },
                onError: () => {
                    Toast.show({
                        type: ALERT_TYPE.DANGER,
                        title: t('kyc.toast.oops.title'),
                        textBody: t('kyc.toast.oops.body'),
                    });
                },
            });
        } catch (error) {
            console.log('Update error:', error);
            Toast.show({
                type: ALERT_TYPE.DANGER,
                title: t('kyc.toast.oops.title'),
                textBody: t('kyc.toast.oops.body'),
            });
        }
    };

    const handleBack = () => navigation.goBack();

    const freelancerTypes = [
        { value: 'FULLTIME', display: t('kyc.step1.freelancerType.fulltime') },
        { value: 'PART_TIME', display: t('kyc.step1.freelancerType.parttime') },
    ];

    if (isLoading) return <LoadingScreen />;

    return (
        <ScreenWrapper safeEdges={['top']}>
            <ScrollView className="flex-1 px-5 my-4">
                <View className="flex-row items-center bg-primary p-4 rounded-2xl mb-6">
                    <View>
                        <Text className="font-semibold text-white text-heading">
                            {t('kyc.update.job_section')}
                        </Text>
                        <Text className="text-white text-body">
                            {t('kyc.update.updateJob_section')}
                        </Text>
                    </View>
                </View>

                {/* Job Title */}
                <FormInput
                    label={t('kyc.step1.jobTitle.label')}
                    placeholder={t('kyc.step1.jobTitle.placeholder')}
                    value={jobTitle}
                    onChangeText={setJobTitle}
                    inputClassName={errors.jobTitle ? 'border-error' : 'border-border'}
                    required
                    isValidate={errors.jobTitle ? t('kyc.step1.jobTitle.required') : ''}
                />

 {/* Freelancer Type */}
                <SelectFreelancerType
                    label={t('kyc.step1.freelancerType.label')}
                    value={freelancerType}
                    onSelect={setFreelancerType}
                    options={freelancerTypes}
                    inputClassName={errors.freelancerType ? 'border-error' : 'border-border'}
                    required
                    ref={categoryRef}
                />

                <View className="mt-2">
                    <SelectInput
                        label={t('kyc.step1.serviceType.label')}
                        value={category}
                        initialSubcategories={subcategories}
                        onSelect={(serviceTypeId, jobIds) => {
                            setCategory(serviceTypeId);
                            setSubcategories(jobIds);
                        }}
                        required
                        isValidate={errors.category ? t('kyc.step1.serviceType.required') : ''}
                    />
                </View>
                {/* Banner Image */}
                <SelectImage
                    image={bannerImageDisplayUri}
                    label={t('kyc.step1.bannerImage.label')}
                    onChange={handleImageChange}
                    required
                    inputClassName={errors.bannerImage ? 'border-error' : 'border-border'}
                    isValidate={errors.bannerImage ? t('kyc.step1.bannerImage.required') : ''}
                />

                {/* Promo Video — receives stable promoVideoDisplayUri only */}
                <SelectVideo
                    video={promoVideoDisplayUri || null}
                    label={t('kyc.step1.promoVideo.label')}
                    onChange={promoteVideoChange}
                />

               
            </ScrollView>

            <View className="px-4 mb-6 flex-row gap-4">
                <TouchableOpacity
                    onPress={handleBack}
                    className="bg-textSecondary mt-6 py-4 rounded-full items-center w-1/3"
                    disabled={isUploading}
                >
                    <Text className="text-white text-base font-semibold">
                        {t('kyc.buttons.back')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleUpdate}
                    className={`bg-primary mt-6 py-4 rounded-full items-center w-64 ${isUploading ? 'opacity-50' : ''}`}
                    disabled={isUploading}
                >
                    <Text className="text-white text-base font-semibold">
                        {isUploading ? t('payment.saving') : t('kyc.update.update')}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: insets.bottom }} />
        </ScreenWrapper>
    );
};

export default EditFreelancerJobsection;
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
} from 'react-native';
import SelectImage from 'components/ui/SelectImage';
import TextArea from 'components/ui/TextArea';
import MultiInputList from 'components/ui/MultiInputList';
import SelectMultiImage from 'components/ui/SelectMultiImage';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import { ScrollView } from 'react-native-gesture-handler';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMyProfile, useUpdateMyProfile } from 'hooks/useFreelancer';
import { FileWithType } from 'types';
import { getPresignedUrls, uploadFileToUrl } from 'api/uploadUtils';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { useTranslation } from 'react-i18next';

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;

const EditFreelancerAboutMe = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    // Form state
    const [aboutMe, setAboutMe] = useState('');
    const [skills, setSkills] = useState<string[]>(['']);
    const [experiences, setExperiences] = useState<string[]>(['']);
    const [resumeImage, setResumeImage] = useState<string>('');
    const [resumeImageFile, setResumeImageFile] = useState<FileWithType | null>(null);
    const [certificateImages, setCertificateImages] = useState<FileWithType[]>([]);
    const [certificateImagesFiles, setCertificateImagesFiles] = useState<FileWithType[]>([]);
    // Loading states
    const [isUploading, setIsUploading] = useState(false);
    const [errors, setErrors] = useState({
        aboutMe: false,
        skills: false,
        experiences: false
    });

    const { t } = useTranslation();
    // API hooks
    const { data, isLoading } = useMyProfile();
    const { mutate: updateProfile, isPending: isUpdating } = useUpdateMyProfile();

    useEffect(() => {
        if (data) {
            setAboutMe(data.about || '');
            setSkills(data.skills?.length > 0 ? data.skills : ['']);
            setExperiences(data.workExperience?.length > 0 ? data.workExperience : ['']);
            setResumeImage(data.resumeImage ? `${IMAGES_BASE_URL}${data.resumeImage}` : '');


            const certificateFiles = data.certificates?.map(cert => ({
                uri: `${IMAGES_BASE_URL}${cert}`,
                name: cert.split('/').pop() || 'certificate.jpg',
                type: 'image/jpeg' // Default type, you might want to detect actual type
            })) || [];


            setCertificateImages(certificateFiles);
            setCertificateImagesFiles(certificateFiles);
        }
    }, [data]);

    const handleResumeImageChange = (file?: FileWithType) => {
        if (file) {
            setResumeImageFile(file);
            setResumeImage(file.uri);
        } else {
            setResumeImageFile(null);
            setResumeImage('');
        }
    };

    const handleCertificateImagesChange = (files: FileWithType[]) => {
        if (files) {
            setCertificateImagesFiles(files);
            setCertificateImages(files);
        } else {
            setCertificateImagesFiles([]);
            setCertificateImages([]);
        }

    };

    const uploadFiles = async (): Promise<{ resumeUrl: string; certificateUrls: string[] }> => {
        const filesToUpload: { name: string; type: string }[] = [];

        // Add resume file if exists
        if (resumeImageFile) {
            filesToUpload.push({
                name: resumeImageFile.name,
                type: resumeImageFile.type,
            });
        }

        // Add certificate files if exist
        certificateImagesFiles.forEach(file => {
            filesToUpload.push({
                name: file.name,
                type: file.type,
            });
        });

        if (filesToUpload.length === 0) {
            return {
                resumeUrl: resumeImage,
                certificateUrls: certificateImages.map(img => img.uri) // Extract URIs
            };
        }

        setIsUploading(true);
        try {
            // Get presigned URLs
            const presignedUrls = await getPresignedUrls(filesToUpload);

            let resumeUrl = resumeImage;
            const certificateUrls: string[] = certificateImages.map(img => img.uri);

            let urlIndex = 0;

            // Upload resume
            if (resumeImageFile) {
                await uploadFileToUrl(
                    presignedUrls[urlIndex].url,
                    resumeImageFile.uri,
                    presignedUrls[urlIndex].contentType
                );
                resumeUrl = presignedUrls[urlIndex].filename;
                urlIndex++;
            }

            // Upload certificates
            for (let i = 0; i < certificateImagesFiles.length; i++) {
                await uploadFileToUrl(
                    presignedUrls[urlIndex].url,
                    certificateImagesFiles[i].uri,
                    presignedUrls[urlIndex].contentType
                );
                if (i < certificateUrls.length) {
                    certificateUrls[i] = presignedUrls[urlIndex].filename;
                } else {
                    certificateUrls.push(presignedUrls[urlIndex].filename);
                }
                urlIndex++;
            }
            console.log('Final certificate URLs:', certificateUrls);
            return { resumeUrl, certificateUrls };

        } catch (error) {
            console.log('File upload error:', error);
            throw new Error('Failed to upload files');
        } finally {
            setIsUploading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {
            aboutMe: !aboutMe.trim(),
            skills: skills.length === 0 || skills.some(skill => !skill.trim()),
            experiences: experiences.length === 0 || experiences.some(exp => !exp.trim()),
        };

        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error);
    };

    const handleUpdate = async () => {
        if (!validateForm()) {
            // Alert.alert('Validation Error', 'Please fill in all required fields');
            return;
        }

        try {
            // Upload files first
            const { resumeUrl, certificateUrls } = await uploadFiles();

            console.log('Uploaded URLs:', { certificateUrls });

            // Prepare update data
            const updateData = {
                about: aboutMe.trim(),
                skills: skills.filter(skill => skill.trim()),
                workExperience: experiences.filter(exp => exp.trim()),
                resumeImage: resumeUrl.replace(IMAGES_BASE_URL || '', ''),
                certificates: certificateUrls.map(url => url.replace(IMAGES_BASE_URL || '', '')),
            };
            console.log('Update data:', updateData);

            // Update profile
            updateProfile(updateData, {
                onSuccess: () => {
                    Toast.show({
                        type: ALERT_TYPE.SUCCESS,
                        title: t('kyc.toast.success.title'),
                        textBody: t('kyc.toast.success.onupdate'),
                    })
                },
                onError: (error) => {
                    Toast.show({
                        type: ALERT_TYPE.DANGER,
                        title: t('kyc.toast.oops.title'),
                        textBody: t('kyc.toast.oops.body'),
                    })
                },
            });

        } catch (error) {
            console.log('Update error:', error);
            // Alert.alert('Error', 'Failed to update profile. Please try again.');
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    const isProcessing = isUpdating || isUploading;

    return (
        <ScreenWrapper safeEdges={['top']}>
            <ScrollView className="flex-1 px-5 pt-6">
                <View className="flex-row items-center bg-primary p-4 rounded-2xl mb-6">
                    <View>
                        <Text className="font-semibold text-white text-heading">{t('kyc.update.describe_to_customers')}</Text>
                        <Text className="text-white text-body">{t('kyc.update.describe_subtext')}</Text>
                    </View>
                </View>

                {/* About Me */}
                <View className="mb-4">
                    <TextArea
                        label={t('kyc.step2.about_label')}
                        placeholder={t('kyc.step2.about_placeholder')}
                        value={aboutMe}
                        onChangeText={setAboutMe}
                        inputClassName={errors.aboutMe ? 'border-error' : 'border-border'}
                        required
                        isValidate={`${errors.aboutMe ? t('kyc.step2.about_required') : ''}`}
                    // editable={!isProcessing}
                    />
                    <Text className="text-caption text-textSecondary mt-1 text-right">
                        {aboutMe.length}/500
                    </Text>

                    <View className="bg-blue-50 border border-primary rounded-xl px-4 py-2 items-center mt-4">
                        <Text className="text-caption text-primary my-2">
                            💡 {t('kyc.step2.about_tip')}
                        </Text>
                    </View>
                </View>

                <MultiInputList
                    title={t('kyc.step2.skills_title')}
                    placeholder={t('kyc.step2.skills_placeholder')}
                    values={skills}
                    onChange={(text, index) => {
                        const updated = [...skills];
                        updated[index] = text;
                        setSkills(updated);
                    }}
                    onAdd={() => {
                        setSkills((prev) => [...prev, '']);
                    }}
                    onRemove={(index) => {
                        const updated = [...skills];
                        updated.splice(index, 1);
                        setSkills(updated);
                    }}
                    required
                    inputClassName={errors.skills ? 'border-error' : 'border-border'}
                    isValidate={errors.skills ? t('kyc.step2.skills_required') : ''}
                // editable={!isProcessing}
                />

                <MultiInputList
                    title={t('kyc.step2.experience_title')}
                    placeholder={t('kyc.step2.experience_placeholder')}
                    values={experiences}
                    onChange={(text, index) => {
                        const updated = [...experiences];
                        updated[index] = text;
                        setExperiences(updated);
                    }}
                    onAdd={() => setExperiences((prev) => [...prev, ''])}
                    onRemove={(index) => {
                        const updated = [...experiences];
                        updated.splice(index, 1);
                        setExperiences(updated);
                    }}
                    required
                    inputClassName={errors.experiences ? 'border-error' : 'border-border'}
                    isValidate={errors.experiences ? t('kyc.step2.experience_required') : ''}

                // editable={!isProcessing}
                />

                {/* Resume Upload */}
                <SelectImage
                    label={t('kyc.step2.resume_label')}
                    image={resumeImage}
                    onChange={handleResumeImageChange}
                    inputClassName="border border-border"
                // editable={!isProcessing}
                />

                {/* Certificates Upload */}
                <SelectMultiImage
                    label={t('kyc.step2.certificate_label')}

                    images={certificateImages}
                    onChange={handleCertificateImagesChange}
                    inputClassName="border border-border"
                // editable={!isProcessing}
                />
            </ScrollView>

            <View className='px-4 mb-6 flex-row gap-4'>
                <TouchableOpacity
                    onPress={handleBack}
                    className="bg-textSecondary mt-6 py-4 rounded-full items-center w-1/3"
                    disabled={isProcessing}
                >
                    <Text className="text-white text-base font-semibold">{t('kyc.buttons.back')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleUpdate}
                    className={`${isProcessing ? 'bg-gray-400' : 'bg-primary'} mt-6 py-4 rounded-full items-center w-64`}
                    disabled={isProcessing}
                >
                    <Text className="text-white text-base font-semibold">
                        {isUploading ? t('kyc.toast.uploading.title') : t('kyc.update.update')}

                    </Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: insets.bottom }} />
        </ScreenWrapper>
    );
};

export default EditFreelancerAboutMe;
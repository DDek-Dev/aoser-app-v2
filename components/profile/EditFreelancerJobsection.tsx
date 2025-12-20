import React, { useEffect, useRef, useState } from 'react';
import {
    Text,
    TouchableOpacity,
    View,
    Alert,
} from 'react-native';
import FormInput from 'components/ui/Input';
import SelectInput from 'components/ui/SelectInput';
import { getCategories, useFreelancerById, useMyProfile, useUpdateFreelancerProfile } from 'hooks/useFreelancer';
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
import { Freelancer } from 'types/profile';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;


const EditFreelancerJobsection = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const [jobTitle, setJobTitle] = useState('');
    const [bannerImage, setBannerImage] = useState<FileWithType | string>('');
    const [bannerImageFile, setBannerImageFile] = useState<FileWithType | null>(null);
    const [promoteVideoFile, setPromoteVideoFile] = useState<FileWithType | null>(null);
    const [promoVideo, setPromoVideo] = useState<FileWithType | string>('');
    const [freelancerType, setFreelancerType] = useState('FULLTIME');
    const [category, setCategory] = useState('');
    const [subcategories, setSubcategories] = useState<string[]>([]);
    const [errors, setErrors] = useState({ jobTitle: false, category: false, bannerImage: false, freelancerType: false });
    const [isUploading, setIsUploading] = useState(false);

    const categoryRef = useRef<{ focus: () => void }>(null);
    const { data } = useMyProfile();
    const { data: profile, isLoading } = useFreelancerById(data?._id || '');
    const updateProfileMutation = useUpdateFreelancerProfile();

    useEffect(() => {
        if (profile) {

            console.log("sub ----: ", profile.jobs)
            setJobTitle(profile.jobTitle || '');
            setBannerImage(`${IMAGES_BASE_URL}${profile.bannerImage}` || '');
            setPromoVideo(`${IMAGES_BASE_URL}${profile.videoPromote}`|| '');
            setFreelancerType(profile.freelancerType || '');
            setCategory(profile.serviceType || '');
            setSubcategories(profile.jobs || []);
        }
    }, [profile]);


    const handleImageChange = (file?: FileWithType) => {
        if (file) {
            setBannerImageFile(file);
            setBannerImage(file.uri); // Show preview
        } else {
            // Handle removal
            setBannerImageFile(null);
            setBannerImage(''); // Clear the image
        }
    };

    const promoteVideoChange = (file?: FileWithType) => {
        if (file) {
            setPromoteVideoFile(file);
            setPromoVideo(file.uri);
        } else {
            // Handle removal
            setPromoteVideoFile(null);
            setPromoVideo(''); // Clear the video
        }
    };

    const uploadBannerImage = async (): Promise<{ bannerUrl: string, videoUrl: string }> => {


        let bannerUrl = bannerImage as string;
        let videoUrl = promoVideo as string;

        setIsUploading(true);
        try {
            const filesToUpload = [];

            if (bannerImageFile) {
                filesToUpload.push({
                    name: bannerImageFile.name,
                    type: bannerImageFile.type,
                });
            }

            if (promoteVideoFile) {
                filesToUpload.push({
                    name: promoteVideoFile.name,
                    type: promoteVideoFile.type,
                });
            }

            if (filesToUpload.length === 0) {
                // If no new files, extract filename only from existing URLs
                if (typeof bannerImage === 'string' && bannerImage.includes('/uploads/')) {
                    bannerUrl = bannerImage.substring(bannerImage.indexOf('/uploads/') + '/uploads/'.length);
                } else if (typeof bannerImage === 'string' && !bannerImage.startsWith('file://')) {
                    // If it's already just a filename, keep it as is
                    bannerUrl = bannerImage.replace('/uploads/', '');
                }

                if (typeof promoVideo === 'string' && promoVideo.includes('/uploads/')) {
                    videoUrl = promoVideo.substring(promoVideo.indexOf('/uploads/') + '/uploads/'.length);
                } else if (typeof promoVideo === 'string' && !promoVideo.startsWith('file://')) {
                    // If it's already just a filename, keep it as is
                    videoUrl = promoVideo.replace('/uploads/', '');
                }

                return { bannerUrl, videoUrl };
            }


            // Get presigned URLs
            const presignedUrls = await getPresignedUrls(filesToUpload);
            console.log('Presigned URLs:', presignedUrls);


            // Upload files

            let urlIndex = 0;

            if (bannerImageFile) {
                await uploadFileToUrl(
                    presignedUrls[urlIndex].url,
                    bannerImageFile.uri,
                    presignedUrls[urlIndex].contentType,
                );
                const fullUrl = presignedUrls[urlIndex].url.split('?')[0];
                // Extract just the filename (remove /uploads/ prefix)
                const pathWithUploads = fullUrl.substring(fullUrl.indexOf('/uploads/'));
                bannerUrl = pathWithUploads.replace('/uploads/', '');
                urlIndex++;
            } else {
                // If no new banner image, extract filename only from existing URL
                if (typeof bannerImage === 'string' && bannerImage.includes('/uploads/')) {
                    bannerUrl = bannerImage.substring(bannerImage.indexOf('/uploads/') + '/uploads/'.length);
                } else if (typeof bannerImage === 'string' && !bannerImage.startsWith('file://')) {
                    bannerUrl = bannerImage.replace('/uploads/', '');
                }
            }

            if (promoteVideoFile) {
                await uploadFileToUrl(
                    presignedUrls[urlIndex].url,
                    promoteVideoFile.uri,
                    presignedUrls[urlIndex].contentType,
                );
                const fullUrl = presignedUrls[urlIndex].url.split('?')[0];
                // Extract just the filename (remove /uploads/ prefix)
                const pathWithUploads = fullUrl.substring(fullUrl.indexOf('/uploads/'));
                videoUrl = pathWithUploads.replace('/uploads/', '');
            } else {
                // If no new video, extract filename only from existing URL
                if (typeof promoVideo === 'string' && promoVideo.includes('/uploads/')) {
                    videoUrl = promoVideo.substring(promoVideo.indexOf('/uploads/') + '/uploads/'.length);
                } else if (typeof promoVideo === 'string' && !promoVideo.startsWith('file://')) {
                    videoUrl = promoVideo.replace('/uploads/', '');
                }
            }

            console.log('Files uploaded successfully');
            console.log('Final filenames (no path):', { bannerUrl, videoUrl });
            return { bannerUrl, videoUrl };

        } catch (error) {
            console.log('Upload error:', error);
            throw new Error('Failed to upload files');
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdate = async () => {
        // Validate form
        const newErrors = {
            jobTitle: !jobTitle.trim(),
            category: !category,
            bannerImage: !bannerImage,
            freelancerType: !freelancerType,
        };

        setErrors(newErrors);

        if (Object.values(newErrors).some(error => error)) {
            // Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        try {
            // Upload files if there are new ones
            const { bannerUrl, videoUrl } = await uploadBannerImage();

            // Prepare update data
            const updateData = {
                jobTitle,
                bannerImage: bannerUrl,
                videoPromote: videoUrl,
                freelancerType,
                serviceType: category,
                jobs: subcategories,
            };

            console.log('updateData', updateData);

            // Update profile
            const result = await updateProfileMutation.mutateAsync(updateData as Freelancer);

            console.log('Update successful:', result);

            Toast.show({
                type: ALERT_TYPE.SUCCESS,
                title: 'Success',
                textBody: 'Profile updated successfully',
            })

        } catch (error) {
            console.log('Update error:', error);
            Toast.show({
                type: ALERT_TYPE.DANGER,
                title: 'Error',
                textBody: 'Failed to update profile. Please try again.',
            })}
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const categories = getCategories();
    const freelancerTypes = [
        { value: 'FULLTIME', display: 'Full-time' },
        { value: 'PART_TIME', display: 'Part-time' }
    ];

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <ScreenWrapper safeEdges={['top']}>
            <ScrollView className="flex-1 px-5 my-4">
                <View className="flex-row items-center bg-primary p-4 rounded-2xl mb-6">
                    <View>
                        <Text className="font-semibold text-white text-heading">Job Section</Text>
                        <Text className="text-white text-body">Update your job section carefully.</Text>
                    </View>
                </View>

                {/* Job Title Input */}
                <FormInput
                    label="Job Title"
                    placeholder="e.g. Web developer and designer..."
                    value={jobTitle}
                    onChangeText={setJobTitle}
                    inputClassName={errors.jobTitle ? 'border-error' : 'border-border'}
                    required
                    isValidate={errors.jobTitle ? 'Job title is required' : ''}
                />

                {/* Banner Upload */}
                <SelectImage
                    image={typeof bannerImage === 'string' ? `${bannerImage}` : bannerImage.uri}
                    label="Banner Image"
                    onChange={handleImageChange}
                    required
                    inputClassName={errors.bannerImage ? 'border-error' : 'border-border'}
                    isValidate={errors.bannerImage ? 'Banner image is required' : ''}
                />

                {/* Promo Video Upload */}
                <SelectVideo
                    video={typeof promoVideo === 'string' ? promoVideo : promoVideo.uri}
                    label="Promote Yourself (Video)"
                    // onChange={setPromoVideo}
                    onChange={promoteVideoChange}
                />

                {/* Freelancer Type */}
                <SelectFreelancerType
                    label="Freelancer Type"
                    value={freelancerType}
                    onSelect={setFreelancerType}
                    options={freelancerTypes}
                    inputClassName={errors.freelancerType ? 'border-error' : 'border-border'}
                    required
                    ref={categoryRef}
                />

                <View className='mt-2'>
                    <SelectInput
                        label="Choose Category"
                        value={category}
                        initialSubcategories={subcategories}
                        onSelect={(cat, subs) => {
                            setCategory(cat);
                            setSubcategories(subs);
                        }}
                        inputClassName={errors.category ? 'border-error' : 'border-border'}
                        required
                        ref={categoryRef}
                        isValidate={errors.category ? 'Category is required' : ''}
                    />
                </View>
            </ScrollView>

            {/* <UploadScreen/> */}

            <View className='px-4 mb-6 flex-row gap-4 '>
                <TouchableOpacity
                    onPress={handleBack}
                    className="bg-textSecondary mt-6 py-4 rounded-full items-center w-1/3"
                    disabled={isUploading}
                >
                    <Text className="text-white text-base font-semibold">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleUpdate}
                    className={`bg-primary mt-6 py-4 rounded-full items-center w-64 ${isUploading ? 'opacity-50' : ''}`}
                    disabled={isUploading}
                >
                    <Text className="text-white text-base font-semibold">
                        {isUploading ? 'Uploading...' : 'Update'}
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={{ height: insets.bottom }} />
        </ScreenWrapper>
    );
};

export default EditFreelancerJobsection;
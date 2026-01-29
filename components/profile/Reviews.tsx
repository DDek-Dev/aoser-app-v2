import { use, useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Review } from 'types';
import { useTranslation } from 'react-i18next';
import { profileImage } from 'assets';
import { formatDate } from 'utils/dateFormatter';

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;
type ReviewsProps = {
  reviews: Review[];
};

const renderStars = (rating: number) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <MaterialIcons
        key={`star-${i}`}
        name={i <= rating ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
        size={20}
        color="#facc15"
      />
    );
  }
  return <View className="flex-row">{stars}</View>;
};

export default function Reviews({ reviews }: ReviewsProps) {
  const [visibleCount, setVisibleCount] = useState(3);
  const { t } = useTranslation();
  const handleSeeMore = () => {
    setVisibleCount(prev => prev + 5);
  };


  console.log('reviews', JSON.stringify);

  const visibleReviews = reviews.slice(0, visibleCount);
  const showSeeMore = reviews.length > visibleCount;

  const avgRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  

  // ຟັງຊັນປອດໄພສຳລັບການດຶງຂໍ້ມູນ reviewer
  const getReviewerInfo = (review: any) => {
  
    if (!review || !review.reviewer) {
      return {
        profileImage: null,
        name: t('freelancer_profile.review.unknown_user'),
        hasProfile: false
      };
    }

    return {
      profileImage: review.reviewer.profileImage || null,
      name: `${review.reviewer.firstName || ''} ${review.reviewer.lastName || ''}`.trim() || 'User',
      hasProfile: true
    };
  };
  return (
    <View className="mt-12 px-5">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-semibold text-gray-800">
          {t('freelancer_profile.review.customer_reviews')}
        </Text>
        <Text className="text-xs text-blue-600">{reviews.length} {t('freelancer_profile.review.review')}</Text>
      </View>

      <View className="flex-row gap-4 items-center mb-6">
        <View className="items-center h-24 w-24 bg-blue-100 justify-center rounded-full">
          <Text className="text-2xl font-bold text-blue-600">{avgRating}</Text>
          <Text className="text-gray-500 text-sm">{t('freelancer_profile.review.from')} 5.0</Text>
        </View>
        <View className="items-center">
          {renderStars(parseFloat(avgRating))}
        </View>
      </View>

      {visibleReviews.length > 0 ? (
        <>
          {visibleReviews.map((review) => {
            const reviewerInfo = getReviewerInfo(review);

            return (
              <View key={review._id || Math.random().toString()} className="mb-6">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Image
                      source={reviewerInfo.profileImage ? { uri: IMAGES_BASE_URL + reviewerInfo.profileImage } : profileImage}
                      className="w-10 h-10 rounded-full"
                      onError={() => console.log(`Failed to load image for review ${review._id}`)}
                    />
                    <View>
                      <Text className="font-semibold text-gray-700">
                        {reviewerInfo.name}
                      </Text>
                      {renderStars(review.rating || 0)}
                    </View>
                  </View>
                  <Text className="text-xs text-gray-400">
                    {review.createdAt ? formatDate(review.createdAt) : 'No date'}
                  </Text>
                </View>

                {review.comment && (
                  <Text className="mt-2 text-sm text-gray-600">{review.comment}</Text>
                )}

                <View className="h-[1px] w-full bg-gray-200 mt-4" />
              </View>
            );
          })}

          {showSeeMore && (
            <TouchableOpacity
              onPress={handleSeeMore}
              className="self-center mt-2 border border-gray-200 w-full py-2 rounded"
            >
              <Text className="text-blue-600 text-sm font-medium text-center">
                {t('freelancer_profile.review.seemore')}
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View className="py-8 items-center">
          <Text className="text-gray-500">{t('freelancer_profile.review.no_rewiew')}</Text>
        </View>
      )}
    </View>
  );
}
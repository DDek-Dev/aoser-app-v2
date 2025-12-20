import { View } from "react-native"

export const TopFreelancerSkelenton = () => {
    return (
        <View className="w-64 mr-4 bg-white rounded-xl overflow-hidden border border-border">
            {/* Banner Skeleton */}
            <View className="w-full h-28 bg-gray-300 animate-pulse" />
            
            <View className="p-2 space-y-1">
                <View className="flex-row justify-between">
                    <View className="flex-row gap-2">
                        {/* Star Rating Skeleton */}
                        <View className="w-12 h-5 bg-gray-300 rounded animate-pulse" />
                    </View>
                    {/* Price Skeleton */}
                    <View className="w-24 h-6 bg-gray-300 rounded-full animate-pulse" />
                </View>
                
                {/* Job Title Skeleton */}
                <View className="w-40 h-5 bg-gray-300  rounded animate-pulse mt-4" />
                
                {/* Description Skeleton */}
                <View className="space-y-1 mt-1">
                    <View className="w-full h-4 bg-gray-300 mb-2 rounded animate-pulse" />
                    <View className="w-3/4 h-4 bg-gray-300 rounded animate-pulse" />
                </View>
            </View>
        </View>
    )
}
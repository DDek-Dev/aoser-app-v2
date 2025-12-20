import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePopularJobs } from 'hooks/useFreelancer';
import React from 'react';
import { View, Text, Image, Pressable, Keyboard } from 'react-native';
import { FreelancerStackParamList } from 'types/navigation';

// const services = [
//   {
//     title: 'Designer',
//     image: { uri: 'https://youthincmag.com/wp-content/uploads/2017/12/money-from-home.jpg' },
//   },
//   {
//     title: 'Graphic Design\nPhotoshop',
//     image: { uri: 'https://plus.unsplash.com/premium_photo-1661740413748-3779fcdcbdf4?fm=jpg&q=60&w=3000' },
//   },
//   {
//     title: 'Full stack - website',
//     image: { uri: 'https://www.makingsenseofcents.com/wp-content/uploads/2019/09/organized_boss33-1024x684.jpg' },
//   },
//   {
//     title: 'Marketing',
//     image: { uri: 'https://www.makingsenseofcents.com/wp-content/uploads/2019/09/Navyandmustard13-1024x684.jpg' },
//   },
//   {
//     title: 'Teacher',
//     image: { uri: 'https://media.istockphoto.com/id/486325400/photo/teacher-asking-her-students-a-question.jpg?s=612x612&w=0&k=20&c=gA6YxA-uGplqjyZfTKBuOcAXEZz7S_KqgGgEGl8YztQ=' },
//   },
//   {
//     title: 'CEO',
//     image: { uri: 'https://media.istockphoto.com/id/1413766112/photo/successful-mature-businessman-looking-at-camera-with-confidence.jpg?s=612x612&w=0&k=20&c=NJSugBzNuZqb7DJ8ZgLfYKb3qPr2EJMvKZ21Sj5Sfq4=' },
//   },
// ];

const IMAGE_BASE = process.env.EXPO_PUBLIC_IMAGES_URL
export default function PopularServices() {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();


  const { data: services, isLoading, isError, refetch } = usePopularJobs();

  if (isLoading) return <Text>Loading...</Text>
  if (isError) return (
  <View>
    <Text>Something went wrong</Text>
    <Pressable onPress={() => refetch}>
      <Text>Retry</Text>
    </Pressable>
  </View>)
  return (
    <View className="mt-2 ">
      <Text className="text-body font-bold mb-2 px-4">Popular Jobs</Text>
      <View className="flex-row flex-wrap justify-center">
        {services?.slice(0, 6).map((item, index) => (
          <Pressable
            key={index}
            onPress={() => {
              navigation.navigate('SearchView', { query: item.jobInfo.title.trim() });
              Keyboard.dismiss();
            }}
            className="w-[45%] m-2 bg-white rounded-xl overflow-hidden shadow-sm"
          >
            <Image source={{ uri: IMAGE_BASE + item.jobInfo.image }} className="w-full h-28 rounded-t-xl" resizeMode="cover" />
            <View className="p-2">
              <Text className="text-boda text-text text-start">{item.jobInfo.title}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

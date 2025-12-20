import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function FloatingProfileButtons({
  onShare,
  onMessage,
}: {
  onShare: () => void;
  onMessage: () => void;
}) {
  return (
    <View className="absolute bottom-16 left-0 right-0 items-center z-50 px-6">
      <View className="flex-row items-center gap-4">
        {/* Share Profile Button */}
        <Pressable
          onPress={onShare}
          className="flex-row items-center border border-primary rounded-full px-6 py-3 bg-white"
          style={styles.blueShadow}
        >
          <Ionicons name="share-social" size={20} color="#3b82f6" />
          <Text className="text-primary font-semibold ml-2 text-base">
            Share
          </Text>
        </Pressable>

        {/* Message Button */}
        {/* <Pressable
          onPress={onMessage}
          className="w-16 h-16 rounded-full bg-blue-500 items-center justify-center"
          style={styles.blueShadow}
        >
          <Ionicons name="chatbubble-ellipses"  size={24} color="white" />
          
        </Pressable> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blueShadow: {
    shadowColor: '#3b82f6', // Tailwind's blue-500
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8, // for Android
  },
});

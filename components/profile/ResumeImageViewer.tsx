import { View, Text, StyleSheet, StatusBar, Platform, Pressable } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Modal from 'react-native-modal';

type ResumeImageViewerRouteProp = RouteProp<
  { params: { uri: string } },
  'params'
>;

export default function ResumeImageViewer() {
  const navigation = useNavigation();
  const route = useRoute<ResumeImageViewerRouteProp>();
  const { uri } = route.params;

  console.log('uri', uri);
  return (
    <Modal
      isVisible
      backdropOpacity={1}
      style={{ margin: 0 }}
      onBackdropPress={() => navigation.goBack()}
      onBackButtonPress={() => navigation.goBack()}
    >
      <View style={styles.container}>
        <ImageViewer
          imageUrls={[{ url: uri }]}
          enableSwipeDown
          onSwipeDown={() => navigation.goBack()}
          // renderIndicator={() => null}
          backgroundColor="black"
        />

        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 50,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
  },
  backText: {
    color: 'white',
    fontSize: 16,
    // fontSize: 16,
  },
});

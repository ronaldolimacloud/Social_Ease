import React from 'react';
import { StyleSheet, View } from 'react-native';
import VideoPlayer from '../../components/VideoPlayer';

const VIDEO_URL = 'https://d1z0p5svpgge1j.cloudfront.net/bedrock2.mp4';

export default function VideoScreen() {
  return (
    <View style={styles.contentContainer}>
      <VideoPlayer
        videoSource={VIDEO_URL}
        width={405}
        height={275}
        showControls
        caption="Sample video"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 50,
  },
});

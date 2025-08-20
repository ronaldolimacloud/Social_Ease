import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View, Button } from 'react-native';
import { useState, useRef, useEffect } from 'react';

const videoSource =
  'https://d1z0p5svpgge1j.cloudfront.net/bedrock2.mp4';

export default function VideoScreen() {
  // Add these lines - track user interaction
  const [userInitiatedPlay, setUserInitiatedPlay] = useState(false);
  const initialPlaybackHandled = useRef(false);

  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  // Add this event listener to pause the video when it first starts playing
  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (isPlaying && !userInitiatedPlay && !initialPlaybackHandled.current) {
      // This will pause the video after it auto-plays
      player.pause();
      initialPlaybackHandled.current = true;
    }
  });

  return (
    <View style={styles.contentContainer}>
      <VideoView style={styles.video} player={player} allowsFullscreen allowsPictureInPicture />
      <View style={styles.controlsContainer}>
        <Button
          title={isPlaying ? 'Pause' : 'Play'}
          onPress={() => {
            // Update this section - track user intention
            if (isPlaying) {
              player.pause();
            } else {
              setUserInitiatedPlay(true);
              player.play();
            }
          }}
        />
      </View>
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
  video: {
    width: 405,
    height: 275,
  },
  controlsContainer: {
    padding: 10,
  },
});

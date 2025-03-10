import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View, Button, Image, TouchableOpacity } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import * as VideoThumbnails from 'expo-video-thumbnails';

const videoSource =
  'https://d1z0p5svpgge1j.cloudfront.net/bedrock2.mp4';

export default function VideoScreen() {
  // Track user interaction
  const [userInitiatedPlay, setUserInitiatedPlay] = useState(false);
  const initialPlaybackHandled = useRef(false);
  // Add thumbnail state with proper typing
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  // Generate thumbnail when component mounts
  useEffect(() => {
    const generateThumbnail = async () => {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoSource, {
          time: 4500, // Get thumbnail from 2 seconds into the video
          quality: 0.7, // Good quality with reasonable file size
        });
        setThumbnail(uri);
      } catch (e) {
        console.warn('Error generating thumbnail:', e);
      }
    };

    generateThumbnail();
  }, []);

  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  // Pause the video when it first starts playing
  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (isPlaying && !userInitiatedPlay && !initialPlaybackHandled.current) {
      player.pause();
      initialPlaybackHandled.current = true;
    }
  });

  // Function to start playing when thumbnail is clicked
  const handleThumbnailPress = () => {
    setUserInitiatedPlay(true);
    player.play();
  };

  return (
    <View style={styles.contentContainer}>
      <View style={styles.videoContainer}>
        <VideoView style={styles.video} player={player} allowsFullscreen allowsPictureInPicture />
        {thumbnail && !userInitiatedPlay && (
          <TouchableOpacity 
            style={styles.thumbnailContainer} 
            onPress={handleThumbnailPress}
            activeOpacity={0.9}
          >
            <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
            {/* Optional play button overlay */}
            <View style={styles.playButtonOverlay}>
              <View style={styles.playButton}>
                <View style={styles.playButtonTriangle} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>
      {/* <View style={styles.controlsContainer}>
        <Button
          title={isPlaying ? 'Pause' : 'Play'}
          onPress={() => {
            if (isPlaying) {
              player.pause();
            } else {
              setUserInitiatedPlay(true);
              player.play();
            }
          }}
        />
      </View> */}
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
  videoContainer: {
    position: 'relative',
    width: 405,
    height: 275,
  },
  video: {
    width: 405,
    height: 275,
  },
  thumbnailContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 405,
    height: 275,
    backgroundColor: 'black',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  // Play button overlay styling
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 37,
    height: 37,
    borderRadius: 35,
    backgroundColor: 'rgba(8, 79, 33, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 13,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'white',
    transform: [{ rotate: '90deg' }],
    marginLeft: 5,
  },
  controlsContainer: {
    padding: 10,
  },
});
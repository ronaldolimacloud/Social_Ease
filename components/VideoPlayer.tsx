import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View, Button, Image, TouchableOpacity, StyleProp, ViewStyle, Text, Dimensions } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import * as VideoThumbnails from 'expo-video-thumbnails';

// Props interface for our component
interface VideoPlayerProps {
  videoSource: string;
  width?: number;
  height?: number;
  showControls?: boolean;
  thumbnailTime?: number;
  thumbnailQuality?: number;
  containerStyle?: StyleProp<ViewStyle>;
  loop?: boolean;
  caption?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoSource,
  width = Dimensions.get('window').width - 32, // Match article image width
  height = 230, // Match article image height
  showControls = false,
  thumbnailTime = 4500,
  thumbnailQuality = 0.7,
  containerStyle,
  loop = true,
  caption,
}) => {
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
          time: thumbnailTime,
          quality: thumbnailQuality,
        });
        setThumbnail(uri);
      } catch (e) {
        console.warn('Error generating thumbnail:', e);
      }
    };

    generateThumbnail();
  }, [videoSource, thumbnailTime, thumbnailQuality]);

  const player = useVideoPlayer(videoSource, player => {
    player.loop = loop;
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

  // Create styles with dynamic width and height
  const dynamicStyles = StyleSheet.create({
    videoContainer: {
      position: 'relative',
      width,
      height,
      overflow: 'hidden',
      borderRadius: 8, // Match article image border radius
    },
    video: {
      width,
      height,
      borderRadius: 8, // Match article image border radius
    },
    thumbnailContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'black',
      overflow: 'hidden',
      borderRadius: 8, // Match article image border radius
    },
  });

  return (
    <View style={[styles.contentContainer, containerStyle]}>
      <View style={dynamicStyles.videoContainer}>
        <VideoView 
          style={dynamicStyles.video} 
          player={player} 
          allowsFullscreen 
          allowsPictureInPicture 
        />
        {thumbnail && !userInitiatedPlay && (
          <TouchableOpacity 
            style={dynamicStyles.thumbnailContainer} 
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
      
      {/* Caption and divider */}
      {caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>{caption}</Text>
          <View style={styles.divider} />
        </View>
      )}
      
      {showControls && (
        <View style={styles.controlsContainer}>
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
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8, // Match article image border radius
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
  captionContainer: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  captionText: {
    fontSize: 10,
    color: '#85c3c0',
    fontStyle: 'italic',
    marginTop: 8,
    paddingHorizontal: 4,
    lineHeight: 20,
  },
  divider: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#153434',
    marginBottom: 8,
  },
});

export default VideoPlayer;
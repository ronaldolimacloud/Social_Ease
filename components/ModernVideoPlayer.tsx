import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import {
  VideoView,
  useVideoPlayer,
  VideoSource,
  VideoPlayerStatus,
} from 'expo-video';
import { useEvent } from 'expo';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';

interface ModernVideoPlayerProps {
  source: VideoSource;
  posterSource?: VideoSource;
  title?: string;
  autoplay?: boolean;
  allowFullscreen?: boolean;
  startAt?: number;
  onPlaybackStatusUpdate?: (status: VideoPlayerStatus, error?: any) => void;
  style?: ViewStyle;
}

const ModernVideoPlayer: React.FC<ModernVideoPlayerProps> = ({
  source,
  posterSource,
  title,
  autoplay = false,
  allowFullscreen = true,
  startAt = 0,
  onPlaybackStatusUpdate,
  style,
}) => {
  // Create the video player with setup function
  const player = useVideoPlayer(source, player => {
    if (startAt) {
      player.currentTime = startAt;
    }
    if (autoplay) {
      player.play();
    }
  });
  
  // Listen for player status changes
  const { status, error } = useEvent(player, 'statusChange', { 
    status: player.status 
  });
  
  // Listen for playing state changes
  const { isPlaying } = useEvent(player, 'playingChange', { 
    isPlaying: player.playing 
  });
  
  // Call the callback when status changes
  React.useEffect(() => {
    if (onPlaybackStatusUpdate) {
      onPlaybackStatusUpdate(status, error);
    }
  }, [status, error, onPlaybackStatusUpdate]);

  return (
    <View style={[styles.container, style]}>
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen={allowFullscreen}
        nativeControls={false} // Using custom controls
      />
      <View style={styles.controls}>
        {!isPlaying ? (
          <TouchableOpacity onPress={() => player.play()}>
            <AntDesign name="playcircleo" size={32} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => player.pause()}>
            <AntDesign name="pausecircleo" size={32} color="white" />
          </TouchableOpacity>
        )}
        {allowFullscreen && (
          <TouchableOpacity 
            onPress={async () => {
              try {
                await player.enterFullscreen();
              } catch (error) {
                console.error("Failed to enter fullscreen", error);
              }
            }}
          >
            <MaterialIcons name="fullscreen" size={32} color="white" />
          </TouchableOpacity>
        )}
      </View>
      {title && <Text style={styles.title}>{title}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  title: {
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ModernVideoPlayer;
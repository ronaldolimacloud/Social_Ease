import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Dimensions } from 'react-native';
import VideoPlayer from '../../../components/VideoPlayer'; // Import the video player component

export default function NewsArticlePage() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Breaking News: Important Event</Text>
      
      <View style={styles.publisherContainer}>
        <Text style={styles.publisher}>The Daily Chronicle</Text>
        <Text style={styles.date}>March 10, 2025 • 10:30 AM</Text>
      </View>
      
      {/* Full-width article image */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: "https://via.placeholder.com/800x450" }} 
          style={styles.articleImage}
          resizeMode="cover"
        />
        <Text style={styles.imageCaption}>Caption: Description of the image goes here, providing context for readers</Text>
      </View>
      
      {/* Original video player component - restored */}
      <VideoPlayer
        videoSource="https://d1z0p5svpgge1j.cloudfront.net/bedrock2.mp4"
        width={350}
        height={220}
        containerStyle={styles.videoContainer}
        thumbnailTime={3000} // 3 seconds in
      />
      
      <Text style={styles.paragraph}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam 
        eget felis eget urna ultrices mollis a vel massa. Pellentesque habitant 
        morbi tristique senectus et netus et malesuada fames ac turpis egestas.
      </Text>

      <Text style={styles.paragraph}>
        Mauris eu risus enim. Vestibulum ante ipsum primis in faucibus orci luctus 
        et ultrices posuere cubilia curae; Nullam euismod diam vel metus lobortis, 
        vel placerat enim facilisis.
      </Text>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  publisherContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  publisher: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  imageContainer: {
    marginBottom: 20,
  },
  articleImage: {
    width: Dimensions.get('window').width - 32, // Full width minus padding
    height: 230,
    borderRadius: 8,
  },
  imageCaption: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  videoContainer: {
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 16,
    color: '#333',
  },
});
import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ModernVideoPlayer from '../../../components/ModernVideoPlayer';

export default function ArticleWithVideo() {
  // Article data
  const article = {
    title: "The Art of Animation",
    author: "Jane Smith",
    date: "March 10, 2025",
    video: {
      source: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      caption: "Big Buck Bunny - A classic animation short film"
    },
    content: [
      "Animation has evolved significantly over the past century, from hand-drawn frames to sophisticated computer-generated imagery.",
      "The principles established by early animators still form the foundation of modern animation techniques. Concepts like squash and stretch, anticipation, and timing remain fundamental regardless of the technology used.",
      "Today's animation studios blend traditional artistic knowledge with cutting-edge technology to create immersive visual experiences. The film above demonstrates many of these principles in action.",
      "What makes animation particularly powerful is its ability to visualize concepts that would be impossible or impractical to film in real life. This freedom allows creators to build entirely new worlds governed by their own physics and logic.",
      "As technology continues to advance, we're seeing the lines between animation and reality blur. Techniques like motion capture, procedural animation, and AI-assisted workflows are pushing the boundaries of what's possible."
    ]
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.articleTitle}>{article.title}</Text>
        
        <View style={styles.metaInfo}>
          <Text style={styles.author}>By {article.author}</Text>
          <Text style={styles.date}>{article.date}</Text>
        </View>
        
        {/* Video player integrated into the article */}
        <View style={styles.videoContainer}>
          <ModernVideoPlayer 
            source={article.video.source}
            autoplay={false}
            allowFullscreen={true}
            style={styles.videoPlayer}
          />
          <Text style={styles.videoCaption}>{article.video.caption}</Text>
        </View>
        
        {/* Article content */}
        <View style={styles.articleContent}>
          {article.content.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>{paragraph}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  articleTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
  },
  author: {
    fontSize: 14,
    color: '#666',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  videoContainer: {
    marginBottom: 24,
  },
  videoPlayer: {
    borderRadius: 8,
    backgroundColor: '#000',
  },
  videoCaption: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  articleContent: {
    marginTop: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
});
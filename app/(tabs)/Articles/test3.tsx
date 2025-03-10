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
          source={{ uri: "https://www.signupgenius.com/cms/images/blog/blog-1200x600(83).jpg" }} 
          style={styles.articleImage}
          resizeMode="cover"
        />
        <Text style={styles.imageCaption}>Caption: Description of the image goes here, providing context for readers</Text>
      </View>
      
      
      
      <Text style={styles.paragraph}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam 
        eget felis eget urna ultrices mollis a vel massa. Pellentesque habitant 
        morbi tristique senectus et netus et malesuada fames ac turpis egestas.
      </Text>

      <Text style={styles.paragraph}>
        Mauris eu risus enim. Vestibulum ante ipsum primis in faucibus orci luctus 
        et ultrices posuere cubilia curae; Nullam euismod diam vel metus lobortis, 
        vel placerat enim facilisis.

        Mauris eu risus enim. Vestibulum ante ipsum primis in faucibus orci luctus 
        et ultrices posuere cubilia curae; Nullam euismod diam vel metus lobortis, 
        vel placerat enim facilisis.
      </Text>

      {/* Original video player component - restored */}
      <VideoPlayer
        videoSource="https://d1z0p5svpgge1j.cloudfront.net/runway.mp4"
        caption="This is a caption"
        width={350}
        height={220}
        containerStyle={styles.videoContainer}
        thumbnailTime={4500} // 3 seconds in
      />

      <Text style={styles.paragraph}>
      Hey there, ladies! Welcome to the first video in our series all about perimenopause and menopause. I’m your guide—think of me as a friendly journalist and doctor who’s here to break down the big, scary medical stuff into something that feels like a chat over coffee. Today, we’re diving into the wild world of perimenopause. If you’re feeling like your body’s gone rogue, you’re not alone. Let’s unravel this crazy phase together.
      So, what exactly is perimenopause? Imagine your body as a theater troupe getting ready for the big show—that show being menopause. Perimenopause is the dress rehearsal, and let’s just say, it can be a bit chaotic. The actors (your hormones) are stumbling over their lines, the props (your periods) are all over the place, and sometimes, the stage lights (hello, hot flashes) turn up way too high. It’s your body’s way of preparing to slow down and eventually stop your menstrual cycles. Totally normal, but yeah, it can feel like a mess.
      Here’s what’s happening behind the scenes: your ovaries are starting to wind down their production of eggs, and that means your hormone levels—especially estrogen and progesterone—are fluctuating like a DJ fumbling the playlist. One minute, everything’s in sync; the next, it’s a remix of chaos. That’s why you might notice your periods becoming irregular—showing up late, early, or not at all. Some months, they’re light; others, they’re heavy enough to make you wonder if you should build an ark. Annoying? Absolutely. The end of the world? Not even close.
      But wait, there’s more! Hot flashes might crash the party, making you feel like you’ve stepped into a sauna at the most random moments. Sleep might start playing hide-and-seek, leaving you tossing and turning. And don’t even get me started on the mood swings—it’s like being on an emotional rollercoaster where you’re laughing one second and crying over a cute dog video the next. Oh, and brain fog? That’s your mind deciding to take an unscheduled vacation, leaving you wondering where you left your keys… again.
      Now, here’s the important part: every woman’s perimenopause is unique. Some of you might sail through with just a few quirks, while others feel like they’re in the eye of a hormonal storm. There’s no “right” way to experience this phase, and it’s okay to feel overwhelmed. You’re not losing it—your body’s just remixing its rhythm.


      </Text>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#020e0e',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    color: '#FFFFFF',
    lineHeight: 34,
  },
  publisherContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#153434',
  },
  publisher: {
    fontSize: 8,
    fontWeight: '600',
    color: '#85c3c0',
  },
  date: {
    fontSize: 8,
    color: '#FFFFFF',
    opacity: 0.7,
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
    fontSize: 10,
    color: '#85c3c0',
    fontStyle: 'italic',
    marginTop: 8,
    paddingHorizontal: 4,
    lineHeight: 20,
  },
  videoContainer: {
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
    color: '#FFFFFF',
    maxWidth: '95%',
  },
});
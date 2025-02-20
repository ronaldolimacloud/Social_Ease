import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { Authenticator } from '@aws-amplify/ui-react-native';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

Amplify.configure(outputs);

function HomeContent() {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/bg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <Text style={styles.mainText}>CONNECT</Text>
          <Text style={styles.darkText}>TALK</Text>
          <Text style={styles.darkText}>THRIVE</Text>
          
          <Text style={styles.subText}>
            AI-powered personalized insights to help you feel confident in any social situation.
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

export default function Index() {
  return (
    <Authenticator.Provider>
      <Authenticator>
        <HomeContent />
      </Authenticator>
    </Authenticator.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  mainText: {
    fontSize: 45,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 52,
  },
  darkText: {
    fontSize: 45,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 52,
  },
  subText: {
    fontSize: 17,
    color: '#1A1A1A',
    marginTop: 20,
    maxWidth: '80%',
    lineHeight: 22,
  },
});
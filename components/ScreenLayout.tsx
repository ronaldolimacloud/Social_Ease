import { View, ImageBackground, StyleSheet } from 'react-native';

export default function ScreenLayout({ children }) {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/bg-blur-light.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {children}
      </ImageBackground>
    </View>
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
}); 
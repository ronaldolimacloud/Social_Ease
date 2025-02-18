import { View, Text, StyleSheet } from 'react-native';
import ScreenLayout from '../../components/ScreenLayout';

export default function ProfileScreen() {
  return (
    <ScreenLayout>
      <View style={styles.content}>
        <Text style={styles.text}>Profile Content</Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
  },
  text: {
    color: '#020e0e',
  },
}); 
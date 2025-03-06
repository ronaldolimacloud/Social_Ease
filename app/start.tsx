import { View, Text } from 'react-native';

import { router } from 'expo-router';

export default function StartScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text onPress={() => router.push('/auth')}>Start Screen</Text>
    </View>
  );
}

import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function ProfilesScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Profiles</Text>
      <Link href="/(tabs)/profilesao/profiles">Profiles</Link>
      <Link href="/(tabs)/profilesao/new_profile">New Profile</Link>
    </View>
  );
}
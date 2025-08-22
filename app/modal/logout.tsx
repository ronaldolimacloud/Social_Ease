import { Stack } from 'expo-router';
import SettingsScreen from '../../components/logout';

export default function LogoutModal() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <SettingsScreen />
    </>
  );
}



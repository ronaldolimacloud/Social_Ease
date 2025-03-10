
import { Stack } from 'expo-router';


   export default function AppNavigation() {
    return (
   

      <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal_profile"options={{presentation: 'modal',headerShown: false}}/>
          <Stack.Screen name="modalino"options={{presentation: 'modal',headerShown: true}}/>
          <Stack.Screen name="modal"options={{presentation: 'modal',
            }}
          />
        </Stack>
    );
}
    
  
  
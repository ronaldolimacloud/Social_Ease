import { Tabs, } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';








export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "fade",
        tabBarStyle: {
          backgroundColor: '#020e0e',
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: '#90cac7',
        tabBarInactiveTintColor: '#90cac7',
        tabBarShowLabel: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profilesao"
        options={{
          title: 'Profiles',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      
      
      
      <Tabs.Screen
        name="Videos"
        options={{
          title: 'Videos',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="videocam" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Articles"
        options={{
          title: 'Articles',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="newspaper" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  
    
  );
}
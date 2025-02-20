import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ScrollView, Pressable, LayoutChangeEvent } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../components/Header';
import { globalGroups } from './groups';

// Define the Profile type interface that describes the shape of our profile data
type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  description: string;
  bio: string;
  photoUrl: string;
  // Array of insights with their own properties
  insights: Array<{
    id: string;
    text: string;
    timestamp: string;
  }>;
  // Array of groups the profile belongs to
  groups: Array<{
    id: string;
    type: string;
    name: string;
  }>;
};

// Global variable to store profiles that persists across component re-renders
// This acts as a simple in-memory database for the application
export let globalProfiles: Profile[] = [
  // Initial sample profile data
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    description: 'Software Engineer',
    bio: 'Full-stack developer with 5 years of experience in web and mobile development. Passionate about creating user-friendly applications and mentoring junior developers.',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    insights: [
      { id: '1', text: 'Loves hiking on weekends', timestamp: '2024-01-15T10:00:00Z' },
      { id: '2', text: 'Has two dogs named Max and Ruby', timestamp: '2024-01-16T15:30:00Z' },
    ],
    groups: [
      { id: '1', type: 'work', name: 'Engineering Team' },
      { id: '2', type: 'school', name: 'Computer Science' },
    ],
  },
];

// Function to update a profile in the global profiles array
export const updateProfile = (updatedProfile: Profile) => {
  const profileIndex = globalProfiles.findIndex(p => p.id === updatedProfile.id);
  if (profileIndex !== -1) {
    globalProfiles = [...globalProfiles.slice(0, profileIndex), updatedProfile, ...globalProfiles.slice(profileIndex + 1)];
  }
};

// Utility function to add a new profile to the global profiles array
// Takes a profile without an ID and generates one based on the array length
export const addProfile = (profile: Omit<Profile, 'id'>) => {
  const newProfile = {
    ...profile,
    id: String(globalProfiles.length + 1),
  };
  globalProfiles = [...globalProfiles, newProfile];
  return newProfile;
};

// Function to get all available groups for filtering
// Returns an array of group names, always including 'All' as the first option
const getUniqueGroups = (): string[] => {
  return ['All', ...globalGroups.map(group => group.name)];
};

// Main component for displaying profiles
export default function ProfilesScreen() {
  // State management using React hooks
  const [selectedGroup, setSelectedGroup] = useState('All'); // Currently selected group filter
  const [profiles, setProfiles] = useState<Profile[]>(globalProfiles); // List of profiles to display
  const [groupNames, setGroupNames] = useState<string[]>(getUniqueGroups()); // Available group names for filtering
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Effect hook to update group names whenever global groups change
  useEffect(() => {
    setGroupNames(getUniqueGroups());
  }, [globalGroups]);

  // Effect to update profiles when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setProfiles([...globalProfiles]);
    }, [])
  );

  // Filter profiles based on selected group and search query
  const filteredProfiles = profiles.filter(profile => {
    const matchesGroup = selectedGroup === 'All' || 
      profile.groups.some(group => group.name === selectedGroup);
    
    if (!matchesGroup) return false;

    if (searchQuery.trim() === '') return true;

    const searchLower = searchQuery.toLowerCase().trim();
    return (
      profile.firstName.toLowerCase().includes(searchLower) ||
      profile.lastName.toLowerCase().includes(searchLower) ||
      profile.description.toLowerCase().includes(searchLower) ||
      profile.bio.toLowerCase().includes(searchLower) ||
      profile.groups.some(group => group.name.toLowerCase().includes(searchLower))
    );
  });

  // Component to render individual profile cards
  const renderProfile = ({ item }: { item: Profile }) => (
    <Link href={`/profile/${item.id}`} asChild>
      <Pressable style={styles.profileCard}>
        <Image source={{ uri: item.photoUrl }} style={styles.profileImage} />
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{`${item.firstName} ${item.lastName}`}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
          {/* Group tags section */}
          <View style={styles.groupTags}>
            {item.groups.map(group => (
              <View 
                key={group.id} 
                style={[
                  styles.groupTag,
                  { backgroundColor: 
                    // Dynamic background color based on group type
                    group.type === 'work' ? '#C5EEED' : 
                    group.type === 'school' ? '#A6DDDC' : 
                    group.type === 'social' ? '#77B8B6' : '#437C79' 
                  }
                ]}>
                <Ionicons 
                  name={
                    // Dynamic icon based on group type
                    group.type === 'work' ? 'business' : 
                    group.type === 'school' ? 'school' : 
                    group.type === 'social' ? 'people' : 'grid'
                  } 
                  size={12} 
                  color={
                    // Dynamic icon color based on group type
                    group.type === 'work' ? '#437C79' : 
                    group.type === 'school' ? '#437C79' : 
                    group.type === 'social' ? '#437C79' : '#082322'
                  }
                  style={styles.groupTagIcon}
                />
                <Text 
                  style={[
                    styles.groupTagText,
                    { color: 
                      // Dynamic text color based on group type
                      group.type === 'work' ? '#437C79' : 
                      group.type === 'school' ? '#437C79' : 
                      group.type === 'social' ? '#437C79' : '#082322' 
                    }
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {group.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Pressable>
    </Link>
  );

  // Utility function for debugging layout issues
  const logLayout = (componentName: string) => (event: LayoutChangeEvent) => {
    const {x, y, width, height} = event.nativeEvent.layout;
    console.log(`${componentName} Layout:`, {x, y, width, height});
  };

  // Main render function
  return (
    <LinearGradient
      // Define gradient colors from light teal (#90cac7) to dark green-black (#020e0e)
      colors={['#90cac7', '#020e0e']}
      // Apply container styles defined in StyleSheet
      style={styles.container}
      // Start gradient from top-left (0,0)
      start={{ x: 0, y: 0 }}
      // End gradient at bottom-left (0,1), creating a vertical gradient
      end={{ x: 0, y: 1 }}
      // Add locations prop to control color distribution
      locations={[0.5, 1]} // This will show the top color for 50% of the gradient
    >
      <Header 
        showSearch={showSearch}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchPress={() => setShowSearch(true)}
        onSearchClose={() => {
          setShowSearch(false);
          setSearchQuery('');
        }}
        isProfilesTab={true}
      />
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, { backgroundColor: 'transparent' }]}
        onLayout={logLayout('TabsScrollView')}
        contentContainerStyle={styles.tabs}>
        {groupNames.map((groupName) => (
          <Pressable
            key={groupName}
            onPress={() => setSelectedGroup(groupName)}>
            <Text
              style={[
                styles.tabText,
                selectedGroup === groupName && styles.tabTextActive,
              ]}>
              {groupName}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        onLayout={logLayout('FlatList')}
        data={filteredProfiles}
        renderItem={renderProfile}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    borderBottomColor: '#020e0e',
    paddingVertical: 10,
    height: 45,
    zIndex: 1,
  },
  tabs: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 12,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#020e0e',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexGrow: 1,
    backgroundColor: 'transparent',
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#90cac7',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C5EEED',
    marginBottom: 4,
  },
  bio: {
    fontSize: 13,
    color: '#A6DDDC',
    marginBottom: 8,
    lineHeight: 18,
  },
  groupTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  groupTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    maxWidth: '45%',
  },
  groupTagText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  groupTagIcon: {
    marginRight: 3,
  },
});
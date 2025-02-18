import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ScrollView, Pressable, LayoutChangeEvent } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
                    group.type === 'work' ? '#E3F2FD' : 
                    group.type === 'school' ? '#E8F5E9' : 
                    group.type === 'social' ? '#FFF3E0' : '#F5F5F5' 
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
                    group.type === 'work' ? '#1976D2' : 
                    group.type === 'school' ? '#388E3C' : 
                    group.type === 'social' ? '#F57C00' : '#757575'
                  }
                  style={styles.groupTagIcon}
                />
                <Text 
                  style={[
                    styles.groupTagText,
                    { color: 
                      // Dynamic text color based on group type
                      group.type === 'work' ? '#1976D2' : 
                      group.type === 'school' ? '#388E3C' : 
                      group.type === 'social' ? '#F57C00' : '#757575' 
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
    <View 
      style={styles.container}
      onLayout={logLayout('Container')}>
      {/* Header component with search enabled */}
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
      {/* Horizontal scrolling group filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
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

      {/* List of filtered profiles */}
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
    </View>
  );
}

// Styles for the component
const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1, // Makes the container expand to fill all available space in its parent
    backgroundColor: '#F8F8F8', // Light gray background
  },
  // Styles for the tabs container
  tabsContainer: {
    backgroundColor: '#eb0f33',
    borderBottomColor: '#E5E5E5',
    paddingVertical: 10,
    height: 45,
    zIndex: 1, // Add zIndex to ensure it stays on top
  },
  // Horizontal tabs layout
  tabs: {
    // Adds 12 pixels of padding to the left and right sides
    paddingHorizontal: 12,
    // Makes child elements align horizontally in a row instead of vertically in a column
    flexDirection: 'row', 
    // Adds 12 pixels of space between each child element
    gap: 12,
  },
  // Normal tab text style
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },
  // Active tab text style
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  // Profile list container
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexGrow: 1, // Change from flexGrow: 0 to flexGrow: 1
  },
  // Individual profile card styling
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  // Profile image styling
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  // Container for profile text information
  profileInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 4,
  },
  // Profile name text style
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  // Profile description text style
  description: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 4,
  },
  // Profile bio text style
  bio: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 18,
  },
  // Container for group tags
  groupTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  // Individual group tag styling
  groupTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    maxWidth: '45%',
  },
  // Group tag text styling
  groupTagText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  // Group tag icon styling
  groupTagIcon: {
    marginRight: 3,
  },
});
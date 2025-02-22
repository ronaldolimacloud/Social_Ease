import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ScrollView, Pressable, LayoutChangeEvent, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../components/Header';
import { globalGroups } from './groups';
import { useProfiles, type Profile } from '../../lib/hooks/useProfiles';

// Function to get all available groups for filtering
// Returns an array of group names, always including 'All' as the first option
const getUniqueGroups = (): string[] => {
  return ['All', ...globalGroups.map(group => group.name)];
};

// Main component for displaying profiles
export default function ProfilesScreen() {
  // Use our new profiles hook
  const { profiles, loading, error, refetch } = useProfiles();
  
  // State management using React hooks
  const [selectedGroup, setSelectedGroup] = useState('All'); // Currently selected group filter
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
      profile.groups?.some(group => group.name === selectedGroup);
    
    if (!matchesGroup) return false;

    if (searchQuery.trim() === '') return true;

    const searchLower = searchQuery.toLowerCase().trim();
    return (
      profile.firstName.toLowerCase().includes(searchLower) ||
      profile.lastName.toLowerCase().includes(searchLower) ||
      (profile.description?.toLowerCase().includes(searchLower) ?? false) ||
      (profile.bio?.toLowerCase().includes(searchLower) ?? false) ||
      (profile.groups?.some(group => group.name.toLowerCase().includes(searchLower)) ?? false)
    );
  });

  // Component to render individual profile cards
  const renderProfile = ({ item }: { item: Profile }) => (
    <Link href={`/profile/${item.id}`} asChild>
      <Pressable style={styles.profileCard}>
        <Image 
          source={{ uri: item.photoUrl ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop' }} 
          style={styles.profileImage} 
        />
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{`${item.firstName} ${item.lastName}`}</Text>
          {item.description && <Text style={styles.description}>{item.description}</Text>}
          {item.bio && <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>}
          {/* Group tags section */}
          {item.groups && item.groups.length > 0 && (
            <View style={styles.groupTags}>
              {item.groups.map(group => (
                <View 
                  key={group.id} 
                  style={[
                    styles.groupTag,
                    { backgroundColor: 
                      group.type === 'work' ? '#C5EEED' : 
                      group.type === 'school' ? '#A6DDDC' : 
                      group.type === 'social' ? '#77B8B6' : '#437C79' 
                    }
                  ]}>
                  <Ionicons 
                    name={
                      group.type === 'work' ? 'business' : 
                      group.type === 'school' ? 'school' : 
                      group.type === 'social' ? 'people' : 'grid'
                    } 
                    size={12} 
                    color={
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
          )}
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
      colors={['#90cac7', '#020e0e']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[0.5, 1]}
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#437C79" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading profiles</Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
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
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#437C79',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ScrollView, Pressable, LayoutChangeEvent } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';

type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  description: string;
  bio: string;
  photoUrl: string;
  insights: Array<{
    id: string;
    text: string;
    timestamp: string;
  }>;
  groups: Array<{
    id: string;
    type: string;
    name: string;
  }>;
};

// Use a global variable to store profiles across component re-renders
export let globalProfiles: Profile[] = [
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

// Export for use in other components
export const addProfile = (profile: Omit<Profile, 'id'>) => {
  const newProfile = {
    ...profile,
    id: String(globalProfiles.length + 1),
  };
  globalProfiles = [...globalProfiles, newProfile];
  return newProfile;
};

// Get all unique groups from profiles and the global groups list
const getUniqueGroups = (): string[] => {
  const groupsSet = new Set(['All']);
  
  // Add groups from profiles
  globalProfiles.forEach(profile => {
    profile.groups.forEach(group => {
      groupsSet.add(group.name);
    });
  });

  return Array.from(groupsSet);
};

export default function ProfilesScreen() {
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [profiles, setProfiles] = useState<Profile[]>(globalProfiles);
  const [groupNames, setGroupNames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Update groups whenever the component mounts or profiles change
    setGroupNames(getUniqueGroups());
  }, [profiles]);

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = searchQuery
      ? `${profile.firstName} ${profile.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesGroup = selectedGroup === 'All' || 
      profile.groups.some(group => group.name === selectedGroup);

    return matchesSearch && matchesGroup;
  });

  const renderProfile = ({ item }: { item: Profile }) => (
    <Link href={`/profile/${item.id}`} asChild>
      <Pressable style={styles.profileCard}>
        <Image source={{ uri: item.photoUrl }} style={styles.profileImage} />
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{`${item.firstName} ${item.lastName}`}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
          <View style={styles.groupTags}>
            {item.groups.map(group => (
              <View 
                key={group.id} 
                style={[
                  styles.groupTag,
                  { backgroundColor: 
                    group.type === 'work' ? '#E3F2FD' : 
                    group.type === 'school' ? '#E8F5E9' : 
                    group.type === 'social' ? '#FFF3E0' : '#F5F5F5' 
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
                    group.type === 'work' ? '#1976D2' : 
                    group.type === 'school' ? '#388E3C' : 
                    group.type === 'social' ? '#F57C00' : '#757575'
                  }
                  style={styles.groupTagIcon}
                />
                <Text style={[
                  styles.groupTagText,
                  { color: 
                    group.type === 'work' ? '#1976D2' : 
                    group.type === 'school' ? '#388E3C' : 
                    group.type === 'social' ? '#F57C00' : '#757575' 
                  }
                ]}>{group.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </Pressable>
    </Link>
  );

  // Properly type the layout event
  const logLayout = (componentName: string) => (event: LayoutChangeEvent) => {
    const {x, y, width, height} = event.nativeEvent.layout;
    console.log(`${componentName} Layout:`, {x, y, width, height});
  };

  return (
    <View 
      style={styles.container}
      onLayout={logLayout('Container')}>
      <Header 
        showSearch 
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />
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

      <FlatList
        onLayout={logLayout('FlatList')}
        data={filteredProfiles}
        renderItem={renderProfile}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
        ListHeaderComponent={() => (
          <View onLayout={logLayout('ListHeader')} style={{height: 1}} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingVertical: 4,
  },
  tabs: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 12,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  list: {
    paddingHorizontal: 16,
    flexGrow: 0,
    marginTop: -1,
  },
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
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 4,
  },
  bio: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 18,
  },
  groupTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  groupTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  groupTagIcon: {
    marginRight: 4,
  },
  groupTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
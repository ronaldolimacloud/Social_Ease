import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../components/Header';

type Group = {
  id: string;
  name: string;
  type: string;
  description?: string;
};

// Use a global variable to store groups across component re-renders
export let globalGroups: Group[] = [
  { id: '1', type: 'work', name: 'Engineering Team' },
  { id: '2', type: 'school', name: 'Computer Science' },
  { id: '3', type: 'social', name: 'Book Club' },
  { id: '4', type: 'work', name: 'Design Team' },
  { id: '5', type: 'school', name: 'Math Club' },
];

export const addGroup = (group: Omit<Group, 'id'>) => {
  const newGroup = {
    ...group,
    id: String(globalGroups.length + 1),
  };
  globalGroups = [...globalGroups, newGroup];
  return newGroup;
};

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>(globalGroups);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDeleteGroup = (groupId: string) => {
    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            globalGroups = globalGroups.filter(g => g.id !== groupId);
            setGroups(globalGroups);
          }
        }
      ]
    );
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <Pressable style={[
      styles.groupCard,
      { backgroundColor: 
        item.type === 'work' ? '#C5EEED' : 
        item.type === 'school' ? '#A6DDDC' : 
        item.type === 'social' ? '#77B8B6' : '#437C79'
      }
    ]}>
      <View style={styles.groupIcon}>
        <Ionicons 
          name={
            item.type === 'work' ? 'business' : 
            item.type === 'school' ? 'school' : 
            item.type === 'social' ? 'people' : 'grid'
          } 
          size={24} 
          color={
            item.type === 'work' ? '#437C79' : 
            item.type === 'school' ? '#437C79' : 
            item.type === 'social' ? '#437C79' : '#082322'
          }
        />
      </View>
      <View style={styles.groupInfo}>
        <Text style={[
          styles.groupName,
          { color: 
            item.type === 'work' ? '#437C79' : 
            item.type === 'school' ? '#437C79' : 
            item.type === 'social' ? '#437C79' : '#082322'
          }
        ]}>{item.name}</Text>
      </View>
      <Pressable 
        style={styles.deleteButton}
        onPress={() => handleDeleteGroup(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#437C79" />
      </Pressable>
    </Pressable>
  );

  return (
    <LinearGradient
      colors={['#90cac7', '#020e0e']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
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
      />
      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  groupCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  groupInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
});
import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    <Pressable style={styles.groupCard}>
      <View style={[
        styles.groupIcon,
        { backgroundColor: 
          item.type === 'work' ? '#E3F2FD' : 
          item.type === 'school' ? '#E8F5E9' : 
          item.type === 'social' ? '#FFF3E0' : '#F5F5F5' 
        }
      ]}>
        <Ionicons 
          name={
            item.type === 'work' ? 'business' : 
            item.type === 'school' ? 'school' : 
            item.type === 'social' ? 'people' : 'grid'
          } 
          size={24} 
          color={
            item.type === 'work' ? '#1976D2' : 
            item.type === 'school' ? '#388E3C' : 
            item.type === 'social' ? '#F57C00' : '#757575'
          }
        />
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
      </View>
      <Pressable 
        style={styles.deleteButton}
        onPress={() => handleDeleteGroup(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </Pressable>
    </Pressable>
  );

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  list: {
    padding: 16,
  },
  groupCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
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
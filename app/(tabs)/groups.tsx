import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';

type Group = {
  id: string;
  name: string;
  type: string;
  description?: string;
  memberCount: number;
};

// Use a global variable to store groups across component re-renders
export let globalGroups: Group[] = [
  { id: '1', type: 'work', name: 'Engineering Team', memberCount: 12 },
  { id: '2', type: 'school', name: 'Computer Science', memberCount: 45 },
  { id: '3', type: 'social', name: 'Book Club', memberCount: 8 },
  { id: '4', type: 'work', name: 'Design Team', memberCount: 15 },
  { id: '5', type: 'school', name: 'Math Club', memberCount: 20 },
];

export const addGroup = (group: Omit<Group, 'id' | 'memberCount'>) => {
  const newGroup = {
    ...group,
    id: String(globalGroups.length + 1),
    memberCount: 0,
  };
  globalGroups = [...globalGroups, newGroup];
  return newGroup;
};

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>(globalGroups);

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
        <Text style={styles.memberCount}>
          {item.memberCount} {item.memberCount === 1 ? 'member' : 'members'}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Header />
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
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: '#666666',
  },
});
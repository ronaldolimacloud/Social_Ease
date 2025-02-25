import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../components/Header';
import GroupItem from '../../components/GroupItem';
import { useGroup } from '../../lib/hooks/useGroup';
import { client } from '../../lib/amplify';

// Simplified Group type definition
type Group = {
  id: string;
  name: string;
  type?: string;
  description?: string;
  _deleted?: boolean;
  _lastChangedAt?: number;
  _version?: number;
};

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncingGroups, setSyncingGroups] = useState<Record<string, boolean>>({});
  const [isSynced, setIsSynced] = useState(false);
  const { deleteGroup, loading, error } = useGroup();

  useEffect(() => {
    // Use observeQuery for real-time updates
    const subscription = client.models.Group.observeQuery().subscribe({
      next: ({ items, isSynced: syncStatus }) => {
        // Filter out any deleted items
        const validGroups = items
          .filter(item => !item._deleted)
          .map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            description: item.description || undefined,
            _deleted: item._deleted,
            _lastChangedAt: item._lastChangedAt,
            _version: item._version,
          }));
  
        setGroups(validGroups);
        setIsSynced(syncStatus);
      },
      error: (error) => {
        console.error('ObserveQuery error:', error);
        Alert.alert(
          "Error",
          "There was an error loading groups. Please try again later.",
          [{ text: "OK" }]
        );
      }
    });

    // Clean up subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

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
          onPress: async () => {
            try {
              // Mark this group as syncing
              setSyncingGroups(prev => ({ ...prev, [groupId]: true }));
              
              // Delete from database
              await deleteGroup(groupId);
              
              // Remove from syncing state
              setSyncingGroups(prev => {
                const newState = { ...prev };
                delete newState[groupId];
                return newState;
              });
            } catch (error) {
              console.error('Error deleting group:', error);
              
              // Remove from syncing state
              setSyncingGroups(prev => {
                const newState = { ...prev };
                delete newState[groupId];
                return newState;
              });
              
              Alert.alert(
                "Error",
                "Failed to delete group. Please try again.",
                [{ text: "OK" }]
              );
            }
          }
        }
      ]
    );
  };

  const renderContent = () => {
    if (loading && groups.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#437C79" />
        </View>
      );
    }

    if (error && groups.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load groups</Text>
          <Pressable style={styles.retryButton} onPress={() => {}}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    // Filter groups based on search query
    const filteredGroups = searchQuery 
      ? groups.filter(group => 
          group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : groups;

    return (
      <FlatList
        data={filteredGroups}
        renderItem={({ item }) => (
          <GroupItem 
            group={item} 
            onDelete={handleDeleteGroup}
            syncing={syncingGroups[item.id] || false}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No groups found</Text>
            <Text style={styles.emptySubText}>Create a new group to get started</Text>
          </View>
        }
      />
    );
  };

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
      {!isSynced && (
        <View style={styles.syncingBanner}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.syncingText}>Syncing data...</Text>
        </View>
      )}
      {renderContent()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#437C79',
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
  },
  syncingBanner: {
    backgroundColor: 'rgba(67, 124, 121, 0.8)',
    flexDirection: 'row',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncingText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
  },
});
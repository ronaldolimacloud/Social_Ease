import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { deleteGroup, createGroup, loading, error } = useGroup();

  // Helper function to process group data and avoid code duplication
  const processGroupData = (items: any[]) => {
    return items
      .filter(item => !item._deleted)
      .map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        description: item.description || undefined,
        _deleted: item._deleted,
        _lastChangedAt: item._lastChangedAt,
        _version: item._version,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name
  };

  useEffect(() => {
    // Use observeQuery for real-time updates
    const subscription = client.models.Group.observeQuery().subscribe({
      next: ({ items, isSynced: syncStatus }) => {
        // Use the helper function to process items
        const validGroups = processGroupData(items);
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

  // Function to handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Create a new subscription to refresh data
      const subscription = client.models.Group.observeQuery().subscribe({
        next: ({ items, isSynced: syncStatus }) => {
          // Use the helper function to process items
          const validGroups = processGroupData(items);
          setGroups(validGroups);
          setIsSynced(syncStatus);
          setRefreshing(false);
          
          // Unsubscribe after we get the data
          subscription.unsubscribe();
        },
        error: (error) => {
          console.error('ObserveQuery error during refresh:', error);
          Alert.alert(
            "Error",
            "There was an error refreshing groups. Please try again later.",
            [{ text: "OK" }]
          );
          setRefreshing(false);
          
          // Unsubscribe on error
          subscription.unsubscribe();
        }
      });
    } catch (error) {
      console.error('Error during refresh:', error);
      setRefreshing(false);
    }
  };

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

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert("Error", "Group name is required");
      return;
    }

    try {
      // Create the group with just a name
      const result = await createGroup({
        name: newGroupName.trim()
      });

      if (!result.data) {
        throw new Error('Failed to create group - no data returned');
      }
      
      console.log('Group created successfully:', result.data);
      
      // Close modal and reset input
      setShowCreateModal(false);
      setNewGroupName('');
    } catch (err) {
      console.error('Error in handleCreateGroup:', err);
      Alert.alert(
        "Error",
        error || "Failed to create group. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleGroupPress = (groupName: string) => {
    // Navigate to the profiles tab with the selected group as a parameter
    router.push({
      pathname: '/(tabs)/profiles/profiles',
      params: { selectedGroup: groupName }
    });
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
          <Pressable style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    // Filter groups based on search query
    const filteredGroups = searchQuery.trim() 
      ? groups.filter(group => 
          group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : groups;

    // No groups found after filtering by search
    if (filteredGroups.length === 0 && searchQuery.trim() !== '') {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={48} color="#FFFFFF" opacity={0.6} />
          <Text style={styles.emptyText}>No groups match "{searchQuery}"</Text>
          <Text style={styles.emptySubText}>Try a different search term</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredGroups}
        renderItem={({ item }) => (
          <GroupItem
            group={item}
            onDelete={handleDeleteGroup}
            onPress={handleGroupPress}
            syncing={syncingGroups[item.id] || false}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#437C79', '#77B8B6']}
            tintColor="#437C79"
            title="Refreshing groups..."
            titleColor="#437C79"
            progressBackgroundColor="#FFFFFF"
          />
        }
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
      colors={['#061a1a', '#020e0e']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[0.5, 1]}
    >
      {/* Custom Header component with search functionality */}
      <Header 
        showSearch={showSearch}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchPress={() => setShowSearch(true)}
        onSearchClose={() => {
          setShowSearch(false);
          setSearchQuery('');
        }}
        isProfilesTab={true} // Enable search icon for Groups tab too
      />
      
      {/* Create Group button */}
      <View style={styles.actionButtonContainer}>
        <Pressable 
          style={styles.actionButton} 
          onPress={() => {
            setNewGroupName('');
            setShowCreateModal(true);
          }}
        >
          <LinearGradient
            colors={['#092121', '#153434']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.actionButtonGradient}
          >
            <View style={styles.actionButtonIcon}>
              <Ionicons name="people" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionButtonText}>Create Group</Text>
          </LinearGradient>
        </Pressable>
      </View>
      
      {!isSynced && (
        <View style={styles.syncingBanner}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.syncingText}>Syncing data...</Text>
        </View>
      )}
      
      {renderContent()}
      
      {/* Create Group Modal with BlurView */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCreateModal}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <BlurView 
          intensity={50} 
          tint="dark" 
          style={styles.blurContainer}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Group</Text>
                <Pressable 
                  onPress={() => setShowCreateModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#437C79" />
                </Pressable>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={styles.label}>Group Name<Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  placeholder="Enter group name"
                  placeholderTextColor="#77B8B6"
                  autoFocus
                />
              </View>
              
              <View style={styles.modalFooter}>
                <Pressable 
                  style={[styles.saveButton, !newGroupName.trim() && styles.disabledButton]}
                  onPress={handleCreateGroup}
                  disabled={!newGroupName.trim() || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Create Group</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>
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
  // Styles for Create Group button
  actionButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionButton: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonGradient: {
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  actionButtonIcon: {
    width: 40,
    height: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  
  // Updated and new styles for BlurView
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(144, 202, 199, 0.1)',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFF',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FFFF',
  },
  required: {
    color: '#E74C3C',
    marginLeft: 5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A6DDDC',
    fontSize: 12,
    color: '#437C79',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#437C79',
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(144, 202, 199, 0.1)',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    padding: 16,
    backgroundColor: 'transparent',
  },
});
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ScrollView, Pressable, LayoutChangeEvent, ActivityIndicator, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../components/Header';
import { useProfiles, type Profile } from '../../lib/hooks/useProfiles';
import { useProfile } from '../../lib/hooks/useProfile';
import { client } from '../../lib/amplify';
// Import our new modal components
import ProfileModal from '../../components/ProfileModal';
import GroupModal from '../../components/GroupModal';

// Updated function to use actual groups from the database
const useGroups = () => {
  const [groupNames, setGroupNames] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch groups and update state
    const subscription = client.models.Group.observeQuery().subscribe({
      next: ({ items, isSynced }) => {
        if (isSynced) {
          // Filter out deleted groups and extract names
          const validGroups = items
            .filter(item => !(item as any)._deleted)
            .map(item => item.name);
          
          // Add 'All' as the first option and ensure unique names
          setGroupNames(['All', ...Array.from(new Set(validGroups))]);
          setLoading(false);
        }
      },
      error: (error) => {
        console.error('Error fetching groups:', error);
        setLoading(false);
      }
    });

    // Clean up subscription
    return () => subscription.unsubscribe();
  }, []);

  return { groupNames, loading };
};

// Main component for displaying profiles
export default function ProfilesScreen() {
  // Use our new profiles hook
  const { profiles, loading: profilesLoading, error, refetch } = useProfiles();
  // Use the new groups hook
  const { groupNames, loading: groupsLoading } = useGroups();
  // Add useProfile hook to get access to deleteProfile
  const { deleteProfile } = useProfile();
  
  // State management using React hooks
  const [selectedGroup, setSelectedGroup] = useState('All'); // Currently selected group filter
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Add state for syncing profiles (similar to groups)
  const [syncingProfiles, setSyncingProfiles] = useState<Record<string, boolean>>({});
  
  // Add state for modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  
  // Add debug logging to see what profiles data contains
  useEffect(() => {
    console.log(`Profiles updated: ${profiles.length} profiles available`);
  }, [profiles]);
  
  // Filter profiles based on selected group and search query
  const filteredProfiles = profiles.filter(profile => {
    // Check if the profile has groups to begin with
    if (!profile.groups || !Array.isArray(profile.groups)) {
      // Only include in the "All" tab if groups aren't available
      return selectedGroup === 'All';
    }

    // For debugging
    if (selectedGroup !== 'All') {
      console.log(`Filtering for group: ${selectedGroup}`);
      console.log(`Profile ${profile.firstName} has groups:`, JSON.stringify(profile.groups));
    }

    const matchesGroup = selectedGroup === 'All' || 
      profile.groups.some(group => group.name.toLowerCase() === selectedGroup.toLowerCase());
    
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
    <View style={styles.profileCard}>
      <Link href={`/profile/${item.id}`} asChild>
        <Pressable style={styles.profileCardContent}>
          <Image 
            source={{ 
              uri: (item.photoUrl && item.photoUrl.trim() !== '') 
                ? item.photoUrl 
                : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop' 
            }} 
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
            {/* Show syncing indicator if this profile is being deleted */}
            {syncingProfiles[item.id] && (
              <View style={styles.syncIndicator}>
                <ActivityIndicator size="small" color="#437C79" />
                <Text style={styles.syncText}>Syncing...</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Link>
      <Pressable 
        style={styles.deleteButton}
        onPress={() => handleDeleteProfile(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#437C79" />
      </Pressable>
    </View>
  );

  // Utility function for debugging layout issues
  const logLayout = (componentName: string) => (event: LayoutChangeEvent) => {
    // Extract layout measurements (position and dimensions) from the event
    const {x, y, width, height} = event.nativeEvent.layout;
    // Print those measurements to the console for debugging purposes
    console.log(`${componentName} Layout:`, {x, y, width, height});
  };

  // Navigation handlers
  // Function to handle showing the profile modal
  const handleOpenProfileModal = () => {
    setShowProfileModal(true);
  };

  // Function to handle closing the profile modal
  const handleCloseProfileModal = () => {
    console.log('Profile modal closed, triggering refresh');
    // First update the UI state
    setShowProfileModal(false);
    
    // Force an immediate refresh of the profiles data
    refetch();
  };

  // Function to handle showing the group modal
  const handleOpenGroupModal = () => {
    setShowGroupModal(true);
  };

  // Function to handle closing the group modal
  const handleCloseGroupModal = () => {
    console.log('Group modal closed, triggering refresh');
    // First update the UI state
    setShowGroupModal(false);
    
    // Reset the selected group to 'All' to ensure we see all groups
    setSelectedGroup('All');
    
    // Also force a refresh of the profiles with groups
    refetch();
  };

  // Function to handle the deletion of a profile
  const handleDeleteProfile = (profileId: string) => {
    // Display a confirmation dialog to prevent accidental deletions
    Alert.alert(
      "Delete Profile", // Title of the alert dialog
      "Are you sure you want to delete this profile? This action cannot be undone.", // Explanatory message
      [
        {
          text: "Cancel", // Text for the cancel button
          style: "cancel" // Style applied to show it's a cancellation action
        },
        {
          text: "Delete", // Text for the delete confirmation button
          style: "destructive", // Style applied to indicate destructive action (typically red)
          onPress: async () => { // Function executed when the delete button is pressed
            try {
              // Update state to show this profile is currently being synchronized/processed
              setSyncingProfiles(prev => ({ ...prev, [profileId]: true }));
              
              // Delete the profile from the database using the deleteProfile function
              await deleteProfile(profileId);
              
              // Remove this profile from the syncing state after successful deletion
              setSyncingProfiles(prev => {
                // Create a copy of the previous state to avoid direct mutation
                const newState = { ...prev };
                // Remove this specific profile from the syncing state
                delete newState[profileId];
                // Return the updated state without the deleted profile
                return newState;
              });
            } catch (error) {
              // Log any errors that occur during deletion to the console
              console.error('Error deleting profile:', error);
              
              // Even if deletion fails, remove this profile from syncing state
              setSyncingProfiles(prev => {
                // Create a copy of the previous state to avoid direct mutation
                const newState = { ...prev };
                // Remove this specific profile from the syncing state
                delete newState[profileId];
                // Return the updated state
                return newState;
              });
              
              // Show an error message to the user if deletion fails
              Alert.alert(
                "Error", // Title of the error alert
                "Failed to delete profile. Please try again.", // Explanatory error message
                [{ text: "OK" }] // Single button to dismiss the alert
              );
            }
          }
        }
      ]
    );
  };

  // Main render function for the entire component
  return (
    // LinearGradient provides a smooth color transition for the background
    <LinearGradient
      colors={['#90cac7', '#020e0e']}
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
        isProfilesTab={true}
      />

      {/* Container for action cards (Create Profile and Create Group) */}
      <View style={styles.actionCardsContainer}>
        {/* Touchable card for creating a new profile */}
        <Pressable 
          onPress={handleOpenProfileModal}
          style={styles.actionCardBase}
        >
          <LinearGradient
            colors={['#C5EEED', '#69aeaa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.actionCard}
          >
            {/* Icon container */}
            <View style={styles.actionCardIcon}>
              <Ionicons name="person-add" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionCardText}>Create Profile</Text>
          </LinearGradient>
        </Pressable>
        
        {/* Touchable card for creating a new group */}
        <Pressable 
          onPress={handleOpenGroupModal}
          style={styles.actionCardBase}
        >
          <LinearGradient
            colors={['#C5EEED', '#69aeaa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.actionCard}
          >
            {/* Icon container */}
            <View style={styles.actionCardIcon}>
              <Ionicons name="people" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionCardText}>Create Group</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Scrollable horizontal container */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, { backgroundColor: 'transparent' }]}
        onLayout={logLayout('TabsScrollView')}
        contentContainerStyle={styles.tabs}
      >
        {groupsLoading ? (
          // Show loading indicator while groups are being fetched
          <View style={styles.groupLoading}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.groupLoadingText}>Loading groups...</Text>
          </View>
        ) : (
          // Map through each group name and create a pressable tab for it
          groupNames.map((groupName) => (
            <Pressable
              key={groupName} // Unique React key for each item in the list
              onPress={() => setSelectedGroup(groupName)} // Set this as the selected group when pressed
            >
              <Text
                style={[
                  styles.tabText, // Base tab text style
                  selectedGroup === groupName && styles.tabTextActive, // Add active style if this tab is selected
                ]}
              >
                {groupName}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      {profilesLoading ? (
        // Show loading spinner while profiles are being fetched
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#437C79" />
        </View>
      ) : error ? (
        // Show error message if profile loading failed
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading profiles</Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        // If profiles loaded successfully, display them in a scrollable list
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

      {/* Profile modal */}
      <ProfileModal 
        visible={showProfileModal} 
        onClose={handleCloseProfileModal} 
      />
      
      {/* Group modal */}
      <GroupModal 
        visible={showGroupModal} 
        onClose={handleCloseGroupModal} 
      />
    </LinearGradient>
  );
}

// StyleSheet contains all the styling for the component's UI elements
const styles = StyleSheet.create({
  container: {
    flex: 1, // Take up all available space
  },
  actionCardsContainer: {
    flexDirection: 'row', // Arrange children horizontally
    justifyContent: 'space-between', // Space evenly between action cards
    paddingHorizontal: 16, // Add padding on left and right
    paddingVertical: 8, // Add padding on top and bottom
  },
  actionCardBase: {
    width: '48%', // Take up slightly less than half the width (with spacing)
    borderRadius: 12, // Rounded corners
    shadowColor: '#000', // Black shadow
    shadowOffset: { width: 0, height: 2 }, // Shadow offset (x and y)
    shadowOpacity: 0.1, // Shadow transparency
    shadowRadius: 4, // Shadow blur radius
    elevation: 3, // Android shadow elevation
  },
  actionCard: {
    borderRadius: 12, // Rounded corners
    padding: 10, // Inner spacing
    flexDirection: 'row', // Arrange icon and text horizontally
    alignItems: 'center', // Center items vertically
    justifyContent: 'flex-start', // Align items to the start
  },
  actionCardIcon: {
    width: 40, // Fixed width for icon container
    height: 18, // Fixed height for icon container
    backgroundColor: 'transparent', // Fully transparent background
    alignItems: 'center', // Center icon horizontally
    justifyContent: 'center', // Center icon vertically
    marginRight: 10, // Space between icon and text
  },
  actionCardText: {
    fontSize: 12, // Text size
    fontWeight: '500', // Medium font weight
    color: '#FFFFFF', // White text color to contrast with gradient background
  },
  headerContainer: {
    backgroundColor: '#020e0e', // Dark background for header
    paddingHorizontal: 16, // Padding on left and right sides
    zIndex: 2, // Ensures header appears above other elements
  },
  searchWrapper: {
    marginTop: 10, // Space above the search box
    marginBottom: 20, // Space below the search box
    flexDirection: 'row', // Arrange children horizontally
    alignItems: 'center', // Center items vertically
    backgroundColor: '#072727', // Dark background for search box
    borderRadius: 12, // Rounded corners
    padding: 10, // Padding inside search box
  },
  searchInput: {
    flex: 1, // Take up all available space
    marginLeft: 10, // Space to the left of the input text
    color: '#FFFFFF', // White text
    fontSize: 14, // Text size
  },
  searchIcon: {
    color: '#437C79', // Teal color for search icon
  },
  filterIcon: {
    color: '#437C79', // Teal color for filter icon
    marginLeft: 10, // Space to the left of filter icon
  },
  content: {
    flex: 1, // Take up all available space
    backgroundColor: '#020e0e', // Dark background color
  },
  loadingContainer: {
    flex: 1, // Take up all available space
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
  },
  errorContainer: {
    flex: 1, // Take up all available space
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    paddingHorizontal: 24, // Padding on left and right sides
  },
  errorText: {
    fontSize: 16, // Text size
    fontWeight: '500', // Medium font weight
    color: '#FFFFFF', // White text
    marginBottom: 16, // Space below the text
    textAlign: 'center', // Center text horizontally
  },
  retryButton: {
    backgroundColor: '#437C79', // Teal background for button
    paddingHorizontal: 16, // Padding on left and right sides
    paddingVertical: 8, // Padding on top and bottom
    borderRadius: 8, // Rounded corners
  },
  retryButtonText: {
    color: '#FFFFFF', // White text
    fontWeight: '500', // Medium font weight
  },
  tabsContainer: {
    marginVertical: 10, // Margin on top and bottom
  },
  tabs: {
    paddingLeft: 16, // Padding on the left side
    paddingBottom: 8, // Padding on the bottom
    gap: 16, // Space between tab items
  },
  tabText: {
    fontSize: 13, // Text size
    fontWeight: '500', // Medium font weight
    color: '#020e0e', // Dark color for inactive tabs
  },
  tabTextActive: {
    color: '#FFFFFF', // White color for active tab
    fontWeight: '600', // Slightly bolder than inactive tabs
    paddingBottom: 8, // Add space between text and border
    borderBottomWidth: 0.5, // Bottom border to indicate active state
    borderBottomColor: '#FFFFFF', // White border color
  },
  list: {
    paddingHorizontal: 16, // Padding on left and right sides
    paddingTop: 8, // Padding on top
    flexGrow: 1, // Allows the list to grow and take available space
    backgroundColor: 'transparent', // Transparent background
  },
  profileCard: {
    flexDirection: 'row', // Arrange content horizontally
    backgroundColor: '#90cac7', // Light teal background
    borderRadius: 12, // Rounded corners
    padding: 12, // Inner spacing
    shadowColor: '#000', // Black shadow
    shadowOffset: { width: 0, height: 2 }, // Shadow offset (x and y)
    shadowOpacity: 0.1, // Shadow transparency
    shadowRadius: 4, // Shadow blur radius
    elevation: 3, // Android shadow elevation
    marginBottom: 12, // Space below each card
    alignItems: 'center', // Center items vertically
  },
  profileCardContent: {
    flex: 1, // Take up all available space
    flexDirection: 'row', // Arrange content horizontally
  },
  profileImage: {
    width: 80, // Fixed width for profile image
    height: 80, // Fixed height for profile image
    borderRadius: 12, // Rounded corners
  },
  profileInfo: {
    flex: 1, // Take up all available space
    marginLeft: 12, // Space to the left
    marginRight: 4, // Space to the right
  },
  name: {
    fontSize: 16, // Text size
    fontWeight: '600', // Semi-bold font weight
    marginBottom: 2, // Space below the name
    color: '#FFFFFF', // White text color
  },
  description: {
    fontSize: 8, // Text size
    fontWeight: '500', // Medium font weight
    color: '#cdedec', // Light teal text color
    marginBottom: 4, // Space below the description
  },
  bio: {
    fontSize: 9, // Text size
    color: '#517b79', // Very light teal text color
    marginBottom: 8, // Space below the bio
    lineHeight: 14, // Space between lines of text
  },
  groupTags: {
    flexDirection: 'row', // Arrange tags horizontally
    alignItems: 'center', // Center items vertically
    gap: 6, // Space between tags
    flexWrap: 'nowrap', // Don't wrap to new lines
  },
  groupTag: {
    flexDirection: 'row', // Arrange content horizontally
    alignItems: 'center', // Center items vertically
    paddingHorizontal: 6, // Padding on left and right
    paddingVertical: 3, // Padding on top and bottom
    borderRadius: 12, // Rounded corners
    maxWidth: '45%', // Maximum width to prevent overflow
  },
  groupTagText: {
    fontSize: 11, // Small text size
    fontWeight: '500', // Medium font weight
    flex: 1, // Take up available space
  },
  groupTagIcon: {
    marginRight: 9, // Space to the right of the icon
  },
  groupLoading: {
    flexDirection: 'row', // Arrange content horizontally
    alignItems: 'center', // Center items vertically
    justifyContent: 'center', // Center items horizontally
    paddingHorizontal: 12, // Padding on left and right
    minWidth: 120, // Minimum width to ensure proper spacing
    gap: 8, // Space between elements
  },
  groupLoadingText: {
    fontSize: 13, // Text size
    fontWeight: '500', // Medium font weight
    color: '#FFFFFF', // White text color
  },
  deleteButton: {
    padding: 8, // Padding around the button
    marginLeft: 4, // Space to the left of the button
  },
  syncIndicator: {
    flexDirection: 'row', // Arrange content horizontally
    alignItems: 'center', // Center items vertically
    marginTop: 4, // Space on top
  },
  separator: {
    height: 1, // Very thin line
    width: '100%', // Full width
    backgroundColor: '#e0e0e0', // Light gray color
    marginVertical: 12, // Margin on top and bottom
    opacity: 0.6, // Partial transparency
  },
  syncText: {
    fontSize: 12, // Small text size
    color: '#437C79', // Teal text color
    marginLeft: 4, // Space to the left
  },
});
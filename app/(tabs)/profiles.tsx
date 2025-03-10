import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ScrollView, Pressable, LayoutChangeEvent, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../components/Header';
import { useProfiles, type Profile } from '../../lib/hooks/useProfiles';
import { useProfile } from '../../lib/hooks/useProfile';
import { client } from '../../lib/amplify';
// Import our profile modal component
import ProfileModal from '../../components/ProfileModal';
import CustomAlert from '../../components/CustomAlert';

// Import the logo directly
const DEFAULT_PROFILE_IMAGE = require('../../assets/images/logo.png');

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
  // Get URL parameters
  const params = useLocalSearchParams<{ selectedGroup?: string }>();
  
  // Use our new profiles hook
  const { profiles, loading: profilesLoading, error, refetch } = useProfiles();
  // Use the new groups hook
  const { groupNames, loading: groupsLoading } = useGroups();
  // Add useProfile hook to get access to deleteProfile
  const { deleteProfile } = useProfile();
  
  // State management using React hooks
  const [selectedGroup, setSelectedGroup] = useState('All'); // Default to 'All'
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Add state for syncing profiles (similar to groups)
  const [syncingProfiles, setSyncingProfiles] = useState<Record<string, boolean>>({});
  
  // Add state for modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Add state for refresh control
  const [refreshing, setRefreshing] = useState(false);
  
  // Add state for custom alert
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  
  // Update selected group when URL parameter changes or when group names are loaded
  useEffect(() => {
    if (params.selectedGroup && groupNames.includes(params.selectedGroup)) {
      // If there's a valid group in the URL parameters, set it as selected
      setSelectedGroup(params.selectedGroup);
      
      // Clear the parameter from the URL (optional)
      router.setParams({});
    }
  }, [params.selectedGroup, groupNames]);
  
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
  }).sort((a, b) => {
    // Sort alphabetically by first name, then by last name if first names are equal
    const firstNameComparison = a.firstName.localeCompare(b.firstName);
    if (firstNameComparison !== 0) {
      return firstNameComparison;
    }
    // If first names are equal, sort by last name
    return a.lastName.localeCompare(b.lastName);
  });

  // Component to render individual profile cards
  const renderProfile = ({ item }: { item: Profile }) => (
    <View style={styles.profileGridItem}>
      <Link href={`/profile/${item.id}`} asChild>
        <Pressable style={styles.profileGridContent}>
          <Image 
            source={
              item.photoUrl && item.photoUrl.trim() !== ''
                ? { uri: item.photoUrl }
                : DEFAULT_PROFILE_IMAGE
            } 
            style={styles.profileGridImage} 
          />
          {/* Text overlay on the image */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.profileTextOverlay}
          >
            <Text style={styles.gridName} numberOfLines={1}>{`${item.firstName} ${item.lastName}`}</Text>
            {item.description && (
              <Text style={styles.gridDescription} numberOfLines={1}>{item.description}</Text>
            )}
            
            {/* Group tag as a small chip */}
            {item.groups && item.groups.length > 0 && (
              <View style={styles.gridGroupTag}>
                <Ionicons 
                  name={
                    item.groups[0].type === 'work' ? 'business' : 
                    item.groups[0].type === 'school' ? 'school' : 
                    item.groups[0].type === 'social' ? 'people' : 'grid'
                  } 
                  size={10} 
                  color="#FFFFFF"
                  style={styles.gridGroupTagIcon}
                />
                <Text 
                  style={styles.gridGroupTagText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.groups[0].name}
                </Text>
              </View>
            )}
          </LinearGradient>
        </Pressable>
      </Link>
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

  // Update the delete handler
  const handleDeleteProfile = (profileId: string) => {
    setProfileToDelete(profileId);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (!profileToDelete) return;
    
    try {
      // Update state to show this profile is currently being synchronized/processed
      setSyncingProfiles(prev => ({ ...prev, [profileToDelete]: true }));
      
      // Delete the profile from the database using the deleteProfile function
      await deleteProfile(profileToDelete);
      
      // Remove this profile from the syncing state after successful deletion
      setSyncingProfiles(prev => {
        // Create a copy of the previous state to avoid direct mutation
        const newState = { ...prev };
        // Remove this specific profile from the syncing state
        delete newState[profileToDelete];
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
        delete newState[profileToDelete];
        // Return the updated state
        return newState;
      });
      
      // Show an error message to the user if deletion fails
      Alert.alert(
        "Error", // Title of the error alert
        "Failed to delete profile. Please try again.", // Explanatory error message
        [{ text: "OK" }] // Single button to dismiss the alert
      );
    } finally {
      setShowDeleteAlert(false);
      setProfileToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteAlert(false);
    setProfileToDelete(null);
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing profiles:', error);
      Alert.alert(
        "Error",
        "Failed to refresh profiles. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setRefreshing(false);
    }
  };

  // Main render function for the entire component
  return (
    // LinearGradient provides a smooth color transition for the background
    <LinearGradient
      colors={['#061a1a', '#020e0e']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[0.5, 1]}
    >
      {/* Custom Delete Alert */}
      <CustomAlert
        visible={showDeleteAlert}
        title="Delete Profile"
        message="Are you sure you want to delete this profile? This action cannot be undone."
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        loading={profileToDelete ? syncingProfiles[profileToDelete] : false}
        icon="trash-outline"
      />

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

      {/* Container for action cards */}
      <View style={styles.actionCardsContainer}>
        {/* Touchable card for creating a new profile */}
        <Pressable 
          onPress={handleOpenProfileModal}
          style={styles.actionCardBase}
        >
          <LinearGradient
            colors={['#092121', '#153434']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.actionCard}
          >
            {/* Icon container */}
            <View style={styles.actionCardIcon}>
              <Ionicons name="person-add" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.actionCardText}>Create Profile</Text>
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
          <Pressable style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        // If profiles loaded successfully, display them in a scrollable list with pull-to-refresh
        <FlatList
          onLayout={logLayout('FlatList')}
          data={filteredProfiles}
          renderItem={renderProfile}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={false}
          numColumns={2} // Display 2 profiles per row
          columnWrapperStyle={styles.profilesRow}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#437C79', '#77B8B6']}
              tintColor="#437C79"
              title="Refreshing profiles..."
              titleColor="#437C79"
              progressBackgroundColor="#FFFFFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No profiles found</Text>
              <Text style={styles.emptySubText}>Create a new profile to get started</Text>
            </View>
          }
        />
      )}

      {/* Profile modal */}
      <ProfileModal 
        visible={showProfileModal} 
        onClose={handleCloseProfileModal} 
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
    color: '#85c3c0', // Dark color for inactive tabs
  },
  tabTextActive: {
    color: '#FFFFFF', // White color for active tab
    fontWeight: '600', // Slightly bolder than inactive tabs
    paddingBottom: 8, // Add space between text and border
    borderBottomWidth: 0.5, // Bottom border to indicate active state
    borderBottomColor: '#FFFFFF', // White border color
  },
  list: {
    paddingHorizontal: 8, // Slightly tighter padding for larger images
    paddingTop: 8,
    paddingBottom: 16,
    flexGrow: 1,
    backgroundColor: 'transparent',
  },
  profilesRow: {
    justifyContent: 'space-between', // Add space between the grid items
  },
  profileGridItem: {
    width: '48%', // Take up slightly less than half the screen width
    aspectRatio: 0.85, // Control the aspect ratio of the card
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden', // Ensure image stays within borders
  },
  profileGridContent: {
    flex: 1, // Take up all space
    position: 'relative', // For positioning overlay
  },
  profileGridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12, // Match the card's border radius
  },
  profileTextOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 2,
  },
  gridDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: '#e5e5e5',
    marginBottom: 4,
    opacity: 0.9,
  },
  gridGroupTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(67, 124, 121, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start', // Only as wide as needed
    marginTop: 4,
  },
  gridGroupTagIcon: {
    marginRight: 4,
  },
  gridGroupTagText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
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
  // Empty state styles
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
});
import { View, Text, StyleSheet, Image, TextInput, ViewStyle, TextStyle, ImageStyle, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type HeaderProps = {
  showSearch: boolean;
  searchValue: string;
  onSearchChange: (text: string) => void;
  onSearchPress?: () => void;
  onSearchClose?: () => void;
  isProfilesTab?: boolean;
};

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  logo: ImageStyle;
  appName: TextStyle;
  searchContainer: ViewStyle;
  searchInput: TextStyle;
  headerContent: ViewStyle;
};

export default function Header({ 
  showSearch, 
  searchValue, 
  onSearchChange,
  onSearchPress,
  onSearchClose,
  isProfilesTab = false
}: HeaderProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1516575334481-f85287c2c82d?w=200&h=200&fit=crop' }} 
          style={styles.logo} 
        />
        <Text style={styles.appName}>SocialEase</Text>
      </View>
      {showSearch ? (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666666" />
          <TextInput
            style={styles.searchInput}
            value={searchValue}
            onChangeText={onSearchChange}
            placeholder="Search profiles..."
            autoFocus
          />
          <Pressable onPress={onSearchClose}>
            <Ionicons name="close" size={20} color="#666666" />
          </Pressable>
        </View>
      ) : (
        <View style={styles.headerContent}>
          {isProfilesTab && (
            <Pressable onPress={onSearchPress}>
              <Ionicons name="search" size={24} color="#666666" />
            </Pressable>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create<Styles>({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1A1A1A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 12,
  }
});
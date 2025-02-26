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
  logoContainer: ViewStyle;
  searchButton: ViewStyle;
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
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/logo.png')} 
              style={styles.logo} 
            />
            <Text style={styles.appName}>SocialEase</Text>
          </View>
          {isProfilesTab && (
            <Pressable onPress={onSearchPress} style={styles.searchButton}>
              <Ionicons name="search" size={24} color="#FFFF" />
            </Pressable>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create<Styles>({
  container: {
    backgroundColor: '#90cac7',
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#020e0e',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 15,
  },
  searchButton: {
    padding: 4,
  },
});
import { View, Text, StyleSheet, TextInput, ViewStyle, TextStyle, ImageStyle, Pressable } from 'react-native';
import { Image } from 'expo-image';
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
              contentFit="contain"
              transition={{
                duration: 300,
                effect: 'cross-dissolve'
              }}
              cachePolicy="memory" 
            />
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
    backgroundColor: 'transparent',
    paddingVertical: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: '500',
    marginLeft: 8,
    color: '#FFFF',
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
    fontSize: 12,
  },
  searchButton: {
    padding: 4,
  },
});
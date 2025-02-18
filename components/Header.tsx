import { View, Text, StyleSheet, Image, TextInput, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type HeaderProps = {
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
};

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  logo: ImageStyle;
  appName: TextStyle;
  searchContainer: ViewStyle;
  searchIcon: TextStyle;
  searchInput: TextStyle;
};

export default function Header({ showSearch, searchValue, onSearchChange }: HeaderProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1516575334481-f85287c2c82d?w=200&h=200&fit=crop' }} 
          style={styles.logo} 
        />
        <Text style={styles.appName}>SocialEase</Text>
      </View>
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search profiles..."
            value={searchValue}
            onChangeText={onSearchChange}
            placeholderTextColor="#666666"
          />
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
    paddingBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333333',
  },
});
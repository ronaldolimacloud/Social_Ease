import { View, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../components/Header';


export default function CreateScreen() {
  
  return (
    <LinearGradient
      colors={['#90cac7', '#020e0e']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[0.5, 1]}
    >
      <Header 
        showSearch={false}
        searchValue=""
        onSearchChange={() => {}}
      />
      <View style={styles.options}>
        <Link href="/profile/new" asChild>
          <Pressable style={styles.option}>
            <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="person-add" size={32} color="#1976D2" />
            </View>
          </Pressable>
        </Link>

        <Link href="/group/new" asChild>
          <Pressable style={styles.option}>
            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="people" size={32} color="#388E3C" />
            </View>
          </Pressable>
        </Link>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  options: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    padding: 16,
  },
  option: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
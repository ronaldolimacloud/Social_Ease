import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Group = {
  id: string;
  name: string;
  type?: string;
  description?: string;
  _deleted?: boolean;
  _lastChangedAt?: number;
  _version?: number;
};

type GroupItemProps = {
  group: Group;
  onDelete: (id: string) => void;
  syncing?: boolean;
};

/**
 * Simplified GroupItem component for displaying a single group
 * Shows syncing state when data is being synchronized with the cloud
 */
export default function GroupItem({ group, onDelete, syncing = false }: GroupItemProps) {
  return (
    <Pressable
      style={styles.groupCard}
    >
      <View style={styles.groupIcon}>
        <Ionicons name="people" size={24} color="#FFFF" />
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group.name}</Text>
        {syncing && (
          <View style={styles.syncIndicator}>
            <ActivityIndicator size="small" color="#437C79" />
            <Text style={styles.syncText}>Syncing...</Text>
          </View>
        )}
      </View>
      <Pressable 
        style={styles.deleteButton}
        onPress={() => onDelete(group.id)}
      >
        <Ionicons name="trash-outline" size={15} color="#FFFF" />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000', // Black shadow
    shadowOffset: { width: 0, height: 2 }, // Shadow offset (x and y)
    shadowOpacity: 0.1, // Shadow transparency
    shadowRadius: 4, // Shadow blur radius
    elevation: 3,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  groupInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFF',
  },
  deleteButton: {
    padding: 8,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  syncText: {
    fontSize: 12,
    color: '#437C79',
    marginLeft: 4,
  },
}); 
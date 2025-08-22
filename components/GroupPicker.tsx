import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { client } from '../lib/amplify';

type Group = {
  id: string;
  name: string;
  type?: string;
  description?: string;
};

type GroupPickerProps = {
  visible: boolean;
  selectedGroups: Group[];
  onToggle: (group: Group) => void;
  onClose: () => void;
};

export default function GroupPicker({ visible, selectedGroups, onToggle, onClose }: GroupPickerProps) {
  const insets = useSafeAreaInsets();
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const result = await client.models.Group.list({ limit: 1000 });
        if (!mounted) return;
        if (result.data) {
          const mapped: Group[] = result.data.map((g: any) => ({
            id: g.id,
            name: g.name,
            type: g.type,
            description: g.description || undefined,
          }));
          setAvailableGroups(mapped);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (visible) load();
    return () => {
      mounted = false;
    };
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}> 
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Groups</Text>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <Ionicons name="close" size={24} color="#666666" />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1f9b98" />
              <Text style={styles.loadingText}>Loading groups...</Text>
            </View>
          ) : availableGroups.length === 0 ? (
            <View style={styles.emptyGroupsContainer}>
              <Ionicons name="people" size={48} color="#CCCCCC" />
              <Text style={styles.emptyGroupsText}>No groups available</Text>
              <Text style={styles.emptyGroupsSubText}>Create groups in the Groups tab</Text>
            </View>
          ) : (
            <ScrollView style={styles.groupsList}>
              {availableGroups.map(group => {
                const isSelected = selectedGroups.some(g => g.id === group.id);
                return (
                  <Pressable key={group.id} style={[styles.groupItem, isSelected && styles.groupItemSelected]} onPress={() => onToggle(group)}>
                    <View style={styles.groupIcon}>
                      <Ionicons name="people" size={24} color="#1f9b98" />
                    </View>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{group.name}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#1f9b98" />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <Pressable style={styles.modalDone} onPress={onClose}>
            <Text style={styles.modalDoneText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#333333' },
  modalClose: { padding: 8 },
  groupsList: { padding: 16 },
  groupItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, marginBottom: 8, backgroundColor: '#F8F8F8' },
  groupItemSelected: { backgroundColor: 'rgba(31, 155, 152, 0.1)' },
  groupIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(31, 155, 152, 0.1)' },
  groupInfo: { flex: 1, marginLeft: 12 },
  groupName: { fontSize: 16, fontWeight: '500', marginBottom: 2, color: '#333333' },
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666666' },
  emptyGroupsContainer: { padding: 40, alignItems: 'center' },
  emptyGroupsText: { marginTop: 16, fontSize: 18, fontWeight: '600', color: '#333333' },
  emptyGroupsSubText: { marginTop: 8, fontSize: 14, color: '#666666', textAlign: 'center' },
  modalDone: { margin: 16, backgroundColor: '#1f9b98', padding: 16, borderRadius: 12, alignItems: 'center', height: 56 },
  modalDoneText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});



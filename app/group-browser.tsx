import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { 
  Search, 
  Users, 
  Plus, 
  Trophy,
  Calendar,
  ChevronRight,
  X
} from 'lucide-react-native';
import { useGameStore } from '@/hooks/use-game-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function GroupBrowserScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    currentUser, 
    groups, 
    activeGroupId, 
    setActiveGroupId,
    joinGroup,
    createGroup,
  } = useGameStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [joinModal, setJoinModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  if (!currentUser) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'Browse Groups' }} />
        <View style={styles.emptyContainer}>
          <Users size={64} color="#64748B" />
          <Text style={styles.emptyTitle}>Please login to browse groups</Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.replace('/onboarding')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const userGroupIds = groups
    .filter(g => g.members.some(m => m.id === currentUser.id))
    .map(g => g.id);

  const availableGroups = groups.filter(g => !userGroupIds.includes(g.id));
  
  const filteredGroups = availableGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinGroup = (group: any) => {
    setSelectedGroup(group);
    setJoinModal(true);
  };

  const confirmJoinGroup = () => {
    if (selectedGroup) {
      const result = joinGroup(selectedGroup.inviteCode);
      if (result) {
        setJoinModal(false);
        setSelectedGroup(null);
        console.log('Successfully joined group:', result.name);
        router.back();
      } else {
        console.log('Failed to join group');
      }
    }
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      console.log('Please enter a group name');
      return;
    }
    
    createGroup(groupName.trim(), groupDescription.trim());
    setCreateModal(false);
    setGroupName('');
    setGroupDescription('');
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Browse Groups',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#fff',
        }} 
      />
      
      {/* Header Actions */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setCreateModal(true)}
        >
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Available Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Available Groups ({filteredGroups.length})
          </Text>
          
          {filteredGroups.length === 0 ? (
            <View style={styles.emptyGroups}>
              <Users size={48} color="#64748B" />
              <Text style={styles.emptyGroupsTitle}>
                {searchQuery ? 'No groups found' : 'No available groups'}
              </Text>
              <Text style={styles.emptyGroupsText}>
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Create a new group to get started'
                }
              </Text>
            </View>
          ) : (
            filteredGroups.map(group => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupCard}
                onPress={() => handleJoinGroup(group)}
              >
                <LinearGradient
                  colors={['#1E293B', '#334155']}
                  style={styles.groupGradient}
                >
                  <View style={styles.groupHeader}>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <Text style={styles.groupDescription}>
                        {group.description || 'No description'}
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#64748B" />
                  </View>
                  
                  <View style={styles.groupStats}>
                    <View style={styles.statItem}>
                      <Users size={16} color="#0EA5E9" />
                      <Text style={styles.statText}>
                        {group.members.length} members
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Trophy size={16} color="#8B5CF6" />
                      <Text style={styles.statText}>
                        {group.competitions.length} competitions
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Calendar size={16} color="#10B981" />
                      <Text style={styles.statText}>
                        Created {new Date(group.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.groupFooter}>
                    <Text style={styles.inviteCode}>Code: {group.inviteCode}</Text>
                    <View style={styles.joinButton}>
                      <Text style={styles.joinButtonText}>Join Group</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Join Group Modal */}
      <Modal
        visible={joinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join Group</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setJoinModal(false)}
              >
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {selectedGroup && (
              <>
                <View style={styles.groupPreview}>
                  <Text style={styles.previewName}>{selectedGroup.name}</Text>
                  <Text style={styles.previewDescription}>
                    {selectedGroup.description || 'No description'}
                  </Text>
                  <Text style={styles.previewStats}>
                    {selectedGroup.members.length} members • {selectedGroup.competitions.length} competitions
                  </Text>
                </View>
                
                <Text style={styles.confirmText}>
                  Are you sure you want to join this group?
                </Text>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setJoinModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={confirmJoinGroup}
                  >
                    <Text style={styles.confirmButtonText}>Join Group</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Create Group Modal */}
      <Modal
        visible={createModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Group</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setCreateModal(false)}
              >
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.input}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Group Name"
              placeholderTextColor="#64748B"
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              value={groupDescription}
              onChangeText={setGroupDescription}
              placeholder="Description (optional)"
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setCreateModal(false);
                  setGroupName('');
                  setGroupDescription('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleCreateGroup}
              >
                <Text style={styles.confirmButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#0EA5E9',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 16,
  },
  emptyGroups: {
    backgroundColor: '#1E293B',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyGroupsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginTop: 16,
  },
  emptyGroupsText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  groupCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  groupGradient: {
    padding: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  groupStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  groupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  inviteCode: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  joinButton: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  groupPreview: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  previewStats: {
    fontSize: 12,
    color: '#64748B',
  },
  confirmText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500' as const,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600' as const,
  },
});
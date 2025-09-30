import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Users,
  Plus,
  LogOut,
  Settings,
  ChevronRight,
  Search,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AchievementBadges } from '@/components/AchievementBadges';
import { useGameStore } from '@/hooks/use-game-store';
import { supabase } from '@/lib/supabase';
import { createGroupSupabase, requestJoinByCode } from '@/lib/groups';
import { getMyGroups } from '@/lib/groups';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Local session state from Supabase (so we don’t depend on the dummy store)
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setUserId(session?.user?.id ?? null);
      setEmail(session?.user?.email ?? null);
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUserId(s?.user?.id ?? null);
      setEmail(s?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // You can still use your store for stats/group cards (it’s local/dummy for now)
  const {
    currentUser,
    groups,
    activeGroupId,
    setActiveGroupId,
    logout, // your existing store logout
  } = useGameStore();

  const [createGroupModal, setCreateGroupModal] = useState(false);
  const [joinGroupModal, setJoinGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupCode, setGroupCode] = useState('');
const [myGroups, setMyGroups] = useState<{ id: string; name: string }[]>([]);
const [loadingMyGroups, setLoadingMyGroups] = useState(false);
useEffect(() => {
  (async () => {
    if (!userId) return;
    try {
      const rows = await getMyGroups();
      setMyGroups(rows.map(r => ({ id: r.id, name: r.name })));
    } catch {}
  })();
}, [userId]);
useEffect(() => {
  let mounted = true;
  (async () => {
    try {
      setLoadingMyGroups(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { if (mounted) setMyGroups([]); return; }
      const rows = await getMyGroups();
      if (mounted) setMyGroups(rows.map(r => ({ id: r.id, name: r.name })));
    } finally {
      if (mounted) setLoadingMyGroups(false);
    }
  })();
  return () => { mounted = false; };
}, []);


  const displayName = useMemo(
    () => currentUser?.name || currentUser?.username || email || 'Player',
    [currentUser, email]
  );

  if (loading) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator />
        <Text style={{ color: '#94a3b8', marginTop: 8 }}>Checking session…</Text>
      </View>
    );
  }

  // ✅ Gate on Supabase session (not the dummy store)
  if (!userId) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <User size={64} color="#64748B" />
        <Text style={styles.emptyTitle}>Not Logged In</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/auth')}
        >
          <Text style={styles.primaryButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---- Supabase-backed handlers ----
  const handleCreateGroup = async () => {
    try {
      if (!groupName.trim()) {
        Alert.alert('Create group', 'Please enter a group name.');
        return;
      }
      const newId = await createGroupSupabase(groupName.trim(), groupDescription.trim() || null);
      setCreateGroupModal(false);
      setGroupName('');
      setGroupDescription('');
      Alert.alert('Group created', 'Opening group…');
      router.push(`/group-details?groupId=${newId}`);
    } catch (e: any) {
      Alert.alert('Create failed', e?.message ?? 'Could not create group');
    }
  };

  const handleJoinGroup = async () => {
    try {
      if (!groupCode.trim()) {
        Alert.alert('Join group', 'Please enter a group code.');
        return;
      }
      await requestJoinByCode(groupCode.trim());
      setJoinGroupModal(false);
      setGroupCode('');
      Alert.alert('Request sent', 'An admin must approve your request.');
    } catch (e: any) {
      Alert.alert('Join failed', e?.message ?? 'Could not send join request');
    }
  };

  // replace your userGroups calculation:
const fallbackUserGroups = groups.filter(g => g.members.some(m => m.id === currentUser.id));
const displayGroups = myGroups.length > 0 ? myGroups : fallbackUserGroups;

// and replace the JSX that renders user groups with:
{loadingMyGroups ? (
  <View style={styles.emptyGroups}><Text style={styles.emptyGroupsText}>Loading groups…</Text></View>
) : displayGroups.length === 0 ? (
  <View style={styles.emptyGroups}>
    <Text style={styles.emptyGroupsText}>You haven&apos;t joined any groups yet</Text>
  </View>
) : (
  displayGroups.map((group: any) => (
    <TouchableOpacity
      key={group.id}
      style={[
        styles.groupCard,
        activeGroupId === group.id && styles.activeGroupCard,
      ]}
      onPress={() => {
        setActiveGroupId(group.id);
        // Always open the Supabase-backed details screen
        router.push(`/group-details?groupId=${group.id}`);
      }}
    >
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group.name}</Text>
        {/* If this is a fallback (dummy) group, show its stats; otherwise keep it simple */}
        {'members' in group && 'competitions' in group ? (
          <Text style={styles.groupDescription}>
            {group.members.length} members • {group.competitions.length} competitions
          </Text>
        ) : (
          <Text style={styles.groupDescription}>Approved membership</Text>
        )}
      </View>
      {activeGroupId === group.id && (
        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>Active</Text>
        </View>
      )}
      <ChevronRight size={20} color="#64748B" />
    </TouchableOpacity>
  ))
)}

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Profile Header */}
      <LinearGradient
        colors={['#0EA5E9', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileHeader}
      >
        <View style={styles.avatarContainer}>
          <User size={48} color="#fff" />
        </View>
        <Text style={styles.userName}>{displayName}</Text>
        {currentUser?.stats && (
          <>
            <AchievementBadges
              leaguesWon={currentUser.stats.leaguesWon}
              knockoutsWon={currentUser.stats.knockoutsWon}
              size="large"
              style={styles.profileBadges}
            />
            <Text style={styles.joinDate}>
              Member since {new Date(currentUser.joinedAt).toLocaleDateString()}
            </Text>
          </>
        )}
      </LinearGradient>

      {/* Overall Stats (from your store) */}
      {currentUser?.stats && (
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Overall Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.stats.played}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.stats.wins}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.stats.goalsFor}</Text>
              <Text style={styles.statLabel}>Goals</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {currentUser.stats.played > 0 ? Math.round(currentUser.stats.winRate) : 0}%
              </Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.stats.leaguesWon}</Text>
              <Text style={styles.statLabel}>Leagues</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.stats.knockoutsWon}</Text>
              <Text style={styles.statLabel}>Cups</Text>
            </View>
          </View>
        </View>
      )}

      {/* Groups Section */}
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>My Groups</Text>
    <View style={styles.groupActions}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => router.push('/group-browser')}
      >
        <Search size={16} color="#0EA5E9" />
        <Text style={styles.actionText}>Browse</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setJoinGroupModal(true)}
      >
        <Users size={16} color="#0EA5E9" />
        <Text style={styles.actionText}>Join</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setCreateGroupModal(true)}
      >
        <Plus size={16} color="#0EA5E9" />
        <Text style={styles.actionText}>Create</Text>
      </TouchableOpacity>
    </View>
  </View>

  {/* Compute displayGroups here (Supabase first, fallback to local store) */}
  {(() => {
    const fallbackUserGroups = groups.filter(g =>
      g.members.some(m => m.id === currentUser.id)
    );
    const displayGroups: any[] = myGroups.length > 0 ? myGroups : fallbackUserGroups;

    if (loadingMyGroups) {
      return (
        <View style={styles.emptyGroups}>
          <Text style={styles.emptyGroupsText}>Loading groups…</Text>
        </View>
      );
    }

    if (displayGroups.length === 0) {
      return (
        <View style={styles.emptyGroups}>
          <Text style={styles.emptyGroupsText}>
            You haven&apos;t joined any groups yet
          </Text>
        </View>
      );
    }

    return displayGroups.map((group: any) => (
      <TouchableOpacity
        key={group.id}
        style={[
          styles.groupCard,
          activeGroupId === group.id && styles.activeGroupCard,
        ]}
        onPress={() => {
          setActiveGroupId(group.id);
          router.push(`/group-details?groupId=${group.id}`);
        }}
      >
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          {'members' in group && 'competitions' in group ? (
            <Text style={styles.groupDescription}>
              {group.members.length} members • {group.competitions.length} competitions
            </Text>
          ) : (
            <Text style={styles.groupDescription}>Approved membership</Text>
          )}
        </View>
        {activeGroupId === group.id && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>Active</Text>
          </View>
        )}
        <ChevronRight size={20} color="#64748B" />
      </TouchableOpacity>
    ));
  })()}
</View>


      {/* Settings shortcut */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
          <Settings size={20} color="#64748B" />
          <Text style={styles.settingsText}>Settings</Text>
          <ChevronRight size={20} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            try {
              await supabase.auth.signOut(); // make sure Supabase session ends
              await logout();                 // keep your local cleanup if needed
              router.replace('/auth');
            } catch (e: any) {
              Alert.alert('Logout error', e?.message ?? 'Failed to logout');
            }
          }}
        >
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Create Group Modal */}
      <Modal
        visible={createGroupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Group</Text>

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
                  setCreateGroupModal(false);
                  setGroupName('');
                  setGroupDescription('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleCreateGroup}>
                <Text style={styles.submitButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={joinGroupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setJoinGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Group</Text>

            <TextInput
              style={styles.input}
              value={groupCode}
              onChangeText={setGroupCode}
              placeholder="Enter Group Code (e.g., VIPFC26)"
              placeholderTextColor="#64748B"
              autoCapitalize="characters"
              maxLength={12}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Ask your group admin for the invite code. Example: VIPFC26
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setJoinGroupModal(false);
                  setGroupCode('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleJoinGroup}>
                <Text style={styles.submitButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  emptyTitle: { fontSize: 24, fontWeight: '600' as const, color: '#fff', marginTop: 16 },
  primaryButton: { backgroundColor: '#0EA5E9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 24 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' as const },
  profileHeader: { padding: 24, alignItems: 'center' },
  avatarContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  userName: { fontSize: 24, fontWeight: '700' as const, color: '#fff', marginBottom: 4 },
  joinDate: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)' },
  profileBadges: { marginBottom: 8 },
  statsCard: { backgroundColor: '#1E293B', margin: 16, padding: 16, borderRadius: 12 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700' as const, color: '#fff' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' as const, color: '#fff' },
  groupActions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4, backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  actionText: { fontSize: 12, color: '#0EA5E9', fontWeight: '500' as const },
  emptyGroups: { backgroundColor: '#1E293B', padding: 24, borderRadius: 12, alignItems: 'center' },
  emptyGroupsText: { fontSize: 14, color: '#64748B' },
  groupCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 8,
  },
  activeGroupCard: { borderWidth: 2, borderColor: '#0EA5E9' },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 16, fontWeight: '600' as const, color: '#fff', marginBottom: 4 },
  groupDescription: { fontSize: 12, color: '#64748B' },
  activeBadge: { backgroundColor: '#0EA5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 8 },
  activeText: { fontSize: 10, fontWeight: '600' as const, color: '#fff' },
  settingsButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 8,
  },
  settingsText: { flex: 1, fontSize: 16, color: '#fff', marginLeft: 12 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', padding: 16, borderRadius: 12,
  },
  logoutText: { flex: 1, fontSize: 16, color: '#EF4444', marginLeft: 12, fontWeight: '500' as const },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1E293B', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '600' as const, color: '#fff', marginBottom: 24, textAlign: 'center' },
  input: { backgroundColor: '#0F172A', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff', marginBottom: 16 },
  textArea: { height: 80, textAlignVertical: 'top' as const },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#334155', alignItems: 'center' },
  cancelButtonText: { fontSize: 16, color: '#fff', fontWeight: '500' as const },
  submitButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0EA5E9', alignItems: 'center' },
  submitButtonText: { fontSize: 16, color: '#fff', fontWeight: '600' as const },
  infoBox: { backgroundColor: 'rgba(14, 165, 233, 0.1)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.3)', marginBottom: 16 },
  infoText: { fontSize: 12, color: '#0EA5E9', lineHeight: 16 },
});

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Users, Plus, LogOut, Settings, ChevronRight, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AchievementBadges } from '@/components/AchievementBadges';
import { useSessionUser } from '@/hooks/use-session-user';
import { getMyGroups, createGroup, joinGroupByCode } from '@/lib/groups';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Supabase session/profile
  const { loading: authLoading, userId, displayName, signOut } = useSessionUser();

  // Local UI state
  const [createGroupModal, setCreateGroupModal] = useState(false);
  const [joinGroupModal, setJoinGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupCode, setGroupCode] = useState('');

  // Supabase-backed groups for the logged-in user
  const [myGroups, setMyGroups] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loadingMyGroups, setLoadingMyGroups] = useState(false);

  // Load memberships from Supabase (via view v_my_groups)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingMyGroups(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { if (mounted) setMyGroups([]); return; }
        const rows = await getMyGroups();
        if (mounted) setMyGroups(rows.map(r => ({ id: r.id, name: r.name, code: r.code })));
      } catch (e) {
        // no-op: keep UI resilient
      } finally {
        if (mounted) setLoadingMyGroups(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  // Guards
  if (authLoading) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <Text style={styles.emptyTitle}>Loading…</Text>
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <User size={64} color="#64748B" />
        <Text style={styles.emptyTitle}>Not Logged In</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/onboarding')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Temporary zeros for stats (until wired to Supabase)
  const stats = {
    played: 0, wins: 0, goalsFor: 0, winRate: 0, leaguesWon: 0, knockoutsWon: 0,
  };

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
        <AchievementBadges
          leaguesWon={stats.leaguesWon}
          knockoutsWon={stats.knockoutsWon}
          size="large"
          style={styles.profileBadges}
        />
        <Text style={styles.joinDate}>Member</Text>
      </LinearGradient>

      {/* Overall Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Overall Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.played}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.wins}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.goalsFor}</Text>
            <Text style={styles.statLabel}>Goals</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.winRate}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.leaguesWon}</Text>
            <Text style={styles.statLabel}>Leagues</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.knockoutsWon}</Text>
            <Text style={styles.statLabel}>Cups</Text>
          </View>
        </View>
      </View>

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

        {loadingMyGroups ? (
          <View style={styles.emptyGroups}>
            <Text style={styles.emptyGroupsText}>Loading groups…</Text>
          </View>
        ) : myGroups.length === 0 ? (
          <View style={styles.emptyGroups}>
            <Text style={styles.emptyGroupsText}>
              You haven&apos;t joined any groups yet
            </Text>
          </View>
        ) : (
          myGroups.map(group => (
            <TouchableOpacity
              key={group.id}
              style={styles.groupCard}
              onPress={() => router.push(`/group-details?groupId=${group.id}`)}
            >
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupDescription}>Code: {group.code}</Text>
              </View>
              <ChevronRight size={20} color="#64748B" />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Settings shortcut */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Settings size={20} color="#64748B" />
          <Text style={styles.settingsText}>Settings</Text>
          <ChevronRight size={20} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await signOut();
            router.replace('/onboarding');
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
              <TouchableOpacity
                style={styles.submitButton}
                onPress={async () => {
                  if (!groupName.trim()) return;
                  try {
                    await createGroup(groupName.trim(), groupDescription.trim() || undefined);
                    const rows = await getMyGroups();
                    setMyGroups(rows.map(r => ({ id: r.id, name: r.name, code: r.code })));
                    setCreateGroupModal(false);
                    setGroupName('');
                    setGroupDescription('');
                  } catch (e: any) {
                    alert(e?.message ?? 'Could not create group');
                  }
                }}
              >
                <Text style={styles.submitButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Group Modal (by code) */}
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
              placeholder="Enter Group Code (e.g., ABC123)"
              placeholderTextColor="#64748B"
              autoCapitalize="characters"
              maxLength={12}
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Ask your group admin for the invite code.
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
              <TouchableOpacity
                style={styles.submitButton}
                onPress={async () => {
                  const code = groupCode.trim().toUpperCase();
                  if (!code) return;
                  try {
                    await joinGroupByCode(code);
                    // Refresh; join is immediate membership
                    const rows = await getMyGroups();
                    setMyGroups(rows.map(r => ({ id: r.id, name: r.name })));
                    setJoinGroupModal(false);
                    setGroupCode('');
                  } catch (e: any) {
                    alert(e?.message ?? 'Could not join group');
                  }
                }}
              >
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
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  userName: { fontSize: 24, fontWeight: '700' as const, color: '#fff', marginBottom: 4 },
  joinDate: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)' },
  profileBadges: { marginBottom: 8 },
  statsCard: { backgroundColor: '#1E293B', margin: 16, padding: 16, borderRadius: 12 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, flexWrap: 'wrap', rowGap: 12, columnGap: 12 },
  statItem: { alignItems: 'center', minWidth: 90, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '700' as const, color: '#fff' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' as const, color: '#fff' },
  groupActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionText: { fontSize: 12, color: '#0EA5E9', fontWeight: '500' as const },
  emptyGroups: { backgroundColor: '#1E293B', padding: 24, borderRadius: 12, alignItems: 'center' },
  emptyGroupsText: { fontSize: 14, color: '#64748B' },
  groupCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 8 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 16, fontWeight: '600' as const, color: '#fff', marginBottom: 4 },
  groupDescription: { fontSize: 12, color: '#64748B' },
  settingsButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 8 },
  settingsText: { flex: 1, fontSize: 16, color: '#fff', marginLeft: 12 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 16, borderRadius: 12 },
  logoutText: { flex: 1, fontSize: 16, color: '#EF4444', marginLeft: 12, fontWeight: '500' as const },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1E293B', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '600' as const, color: '#fff', marginBottom: 24, textAlign: 'center' },
  input: { backgroundColor: '#0F172A', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff', marginBottom: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#334155', alignItems: 'center' },
  cancelButtonText: { fontSize: 16, color: '#fff', fontWeight: '500' as const },
  submitButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0EA5E9', alignItems: 'center' },
  submitButtonText: { fontSize: 16, color: '#fff', fontWeight: '600' as const },
  infoBox: { backgroundColor: 'rgba(14, 165, 233, 0.1)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.3)', marginBottom: 16 },
  infoText: { fontSize: 12, color: '#0EA5E9', lineHeight: 16 },
});

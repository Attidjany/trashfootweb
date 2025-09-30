import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, UserPlus, ThumbsUp, X, LogOut } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import {
  getGroupMembers,
  leaveGroup,
  requestJoinByGroupId,
  listJoinRequests,
  approveJoin,
  rejectJoin,
  type Group,
} from "@/lib/groups";

export default function GroupDetails() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<
    { user_id: string; role: "owner" | "admin" | "member"; profile_name: string | null }[]
  >([]);
  const [pending, setPending] = useState<{ user_id: string; name: string | null; requested_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string | null; isOwner: boolean; isMember: boolean }>({
    id: null,
    isOwner: false,
    isMember: false,
  });

  // Derived helpers
  const isOwner = me.isOwner;
  const isMember = me.isMember;

  // Load group, my role, members, and (if owner) pending requests
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!groupId) return;
      try {
        setLoading(true);

        // session / me
        const { data: sessionRes } = await supabase.auth.getSession();
        const uid = sessionRes.session?.user?.id ?? null;

        // fetch group (must be member per RLS)
        const { data: gRow, error: gErr } = await supabase.rpc("get_group_by_id", {
  p_group_id: groupId as string,
});
        if (gErr) throw gErr;
        if (!gRow) {
          if (mounted) setGroup(null);
          return;
        }
        if (mounted) setGroup(gRow as Group);

        // members
        const mm = await getGroupMembers(groupId as string);
        if (mounted) setMembers(mm);

        // my status
        const amI = mm.find((m) => m.user_id === uid);
        const isOwnerNow = !!(uid && gRow && uid === gRow.owner_id);
        const isMemberNow = !!amI && amI.role !== undefined;
        if (mounted) setMe({ id: uid, isOwner: isOwnerNow, isMember: isMemberNow });

        // pending requests (owner only)
        if (isOwnerNow) {
          const pend = await listJoinRequests(groupId as string).catch(() => []);
          if (mounted) setPending(pend || []);
        } else {
          if (mounted) setPending([]);
        }
      } catch (e) {
        // You can show an alert here if you like
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [groupId]);

  // OWNER actions
  const handleApprove = async (userId: string) => {
    try {
      if (!group) return;
      await approveJoin(group.id, userId);
      // refresh pending + members
      const [pend, mm] = await Promise.all([
        listJoinRequests(group.id).catch(() => []),
        getGroupMembers(group.id),
      ]);
      setPending(pend || []);
      setMembers(mm);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not approve user");
    }
  };

  const handleReject = async (userId: string) => {
    try {
      if (!group) return;
      await rejectJoin(group.id, userId);
      // refresh pending
      const pend = await listJoinRequests(group.id).catch(() => []);
      setPending(pend || []);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not reject user");
    }
  };

  // NON-MEMBER action: request to join
  const handleRequestJoin = async () => {
    try {
      if (!group) return;
      await requestJoinByGroupId(group.id);
      Alert.alert("Request sent", "Your join request has been submitted.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not send join request");
    }
  };

  // MEMBER action: leave group
  const handleLeave = async () => {
    try {
      if (!group) return;
      await leaveGroup(group.id);
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not leave group");
    }
  };

  const ownerName = useMemo(() => {
    const o = members.find((m) => m.user_id === group?.owner_id);
    return o?.profile_name ?? (group?.owner_id ? group.owner_id.slice(0, 8) : "Owner");
  }, [members, group]);

  if (!groupId) {
    return (
      <View style={styles.container}>
        <Text style={styles.note}>Missing groupId</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ChevronLeft size={20} color="#94A3B8" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={{ paddingVertical: 24 }}>
          <ActivityIndicator />
          <Text style={[styles.note, { marginTop: 8 }]}>Loading…</Text>
        </View>
      ) : !group ? (
        <Text style={styles.title}>Group not found</Text>
      ) : (
        <>
          <Text style={styles.title}>{group.name}</Text>
          {group.description ? <Text style={styles.desc}>{group.description}</Text> : null}

          {/* Invite Code */}
          <View style={styles.card}>
            <Text style={styles.label}>Invite Code</Text>
            <Text style={styles.value}>{group.code}</Text>
          </View>

          {/* Owner */}
          <View style={styles.card}>
            <Text style={styles.label}>Owner</Text>
            <Text style={styles.value}>{ownerName}</Text>
          </View>

          {/* Members */}
          <View style={styles.card}>
            <Text style={styles.label}>Members</Text>
            {members.length === 0 ? (
              <Text style={styles.note}>No members yet.</Text>
            ) : (
              members.map((m) => (
                <View key={m.user_id} style={styles.memberRow}>
                  <Text style={styles.memberName}>{m.profile_name ?? m.user_id.slice(0, 8)}</Text>
                  <Text style={styles.memberRole}>{m.role}</Text>
                </View>
              ))
            )}
          </View>

          {/* Pending Requests (owner only) */}
          {isOwner && (
            <View style={styles.card}>
              <Text style={styles.label}>Pending Requests</Text>
              {pending.length === 0 ? (
                <Text style={styles.note}>No pending requests.</Text>
              ) : (
                pending.map((p) => (
                  <View key={p.user_id} style={styles.pendingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{p.name ?? p.user_id.slice(0, 8)}</Text>
                      <Text style={styles.pendingAt}>Requested: {new Date(p.requested_at).toLocaleString()}</Text>
                    </View>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(p.user_id)}>
                      <ThumbsUp size={16} color="#fff" />
                      <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(p.user_id)}>
                      <X size={16} color="#fff" />
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Actions */}
          {!isMember && (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleRequestJoin}>
              <UserPlus size={18} color="#fff" />
              <Text style={styles.primaryText}>Request to Join</Text>
            </TouchableOpacity>
          )}

          {isMember && !isOwner && (
            <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
              <LogOut size={18} color="#FCA5A5" />
              <Text style={styles.leaveText}>Leave Group</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  backText: { color: "#94A3B8", fontSize: 14 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  desc: { color: "#CBD5E1", fontSize: 14, marginBottom: 16 },
  card: { backgroundColor: "#1E293B", padding: 16, borderRadius: 12, marginBottom: 12 },
  label: { color: "#94A3B8", fontSize: 12, marginBottom: 6 },
  value: { color: "#fff", fontSize: 16, fontWeight: "600" },
  note: { color: "#94A3B8", fontSize: 14 },
  memberRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  memberName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  memberRole: { color: "#94A3B8", fontSize: 12, textTransform: "capitalize" },
  pendingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  pendingAt: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
  approveBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#10B981", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  approveText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  rejectBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EF4444", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  rejectText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  primaryBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0EA5E9", padding: 12, borderRadius: 10, marginTop: 8, justifyContent: "center" },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  leaveBtn: { marginTop: 12, backgroundColor: "#334155", padding: 12, borderRadius: 10, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  leaveText: { color: "#FCA5A5", fontSize: 14, fontWeight: "700" },
});

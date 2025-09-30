import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { getMyGroups } from "@/lib/groups";

export default function GroupBrowser() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<{ id: string; name: string; code: string }[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const rows = await getMyGroups();
        if (mounted) setGroups(rows.map(r => ({ id: r.id, name: r.name, code: r.code })));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Groups</Text>

      {loading ? (
        <Text style={styles.note}>Loading…</Text>
      ) : groups.length === 0 ? (
        <Text style={styles.note}>You haven’t joined any groups yet.</Text>
      ) : (
        groups.map(g => (
          <TouchableOpacity
            key={g.id}
            style={styles.card}
            onPress={() => router.push(`/group-details?groupId=${g.id}`)}
          >
            <Text style={styles.name}>{g.name}</Text>
            <Text style={styles.sub}>Code: {g.code}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", padding: 16 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 12 },
  note: { color: "#94A3B8", fontSize: 14, marginTop: 8 },
  card: { backgroundColor: "#1E293B", padding: 16, borderRadius: 12, marginBottom: 8 },
  name: { color: "#fff", fontSize: 16, fontWeight: "600" },
  sub: { color: "#94A3B8", fontSize: 12, marginTop: 4 },
});

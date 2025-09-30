// lib/groups.ts
import { supabase } from "@/lib/supabase";

// ---------- TYPES ----------

export type Group = {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type MemberRow = {
  user_id: string;
  role: "owner" | "admin" | "member";
  status: string | null;
  profile_name: string | null; // from profiles table if you join
};

// ---------- READ HELPERS ----------

// list only groups I belong to (via v_my_groups view)
export async function getMyGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from("v_my_groups")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Group[];
}

// get group members (with optional profile info)
export async function getGroupMembers(groupId: string): Promise<MemberRow[]> {
  const { data, error } = await supabase
    .from("group_members")
    .select(`
      user_id,
      role,
      status,
      profiles:user_id ( name )
    `)
    .eq("group_id", groupId);

  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    user_id: r.user_id,
    role: r.role,
    status: r.status ?? null,
    profile_name: r.profiles?.name ?? null,
  })) as MemberRow[];
}

// check if I’m a member/owner/admin
export async function amIMember(groupId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return { isMember: false, isAdmin: false, isOwner: false };

  const { data, error } = await supabase
    .from("group_members")
    .select("role,status")
    .eq("group_id", groupId)
    .eq("user_id", uid)
    .maybeSingle();

  if (error) throw error;

  const status = data?.status ?? null;
  const role = data?.role as "owner" | "admin" | "member" | undefined;

  return {
    isMember: !!status,
    isAdmin: role === "admin" || role === "owner",
    isOwner: role === "owner",
    status,
  };
}

// ---------- MUTATIONS ----------

// create a group (via RPC)
export async function createGroup(name: string, description?: string) {
  const { data, error } = await supabase.rpc("create_group", {
    p_name: name,
    p_description: description ?? null,
  });
  if (error) throw error;
  return data as Group;
}

// join a group by its code (via RPC)
export async function joinGroupByCode(code: string) {
  const { data, error } = await supabase.rpc("join_group_by_code", {
    p_code: code.trim().toUpperCase(),
  });
  if (error) throw error;
  return data as Group;
}

// leave a group (delete my membership)
export async function leaveGroup(groupId: string) {
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId);

  if (error) throw error;
  return true;
}

// ---------- JOIN REQUEST FLOW (RPCs) ----------

// request to join a group by ID (creates a pending membership)
export async function requestJoinByGroupId(groupId: string) {
  const { data, error } = await supabase.rpc("request_join_by_group", {
    p_group_id: groupId,
  });
  if (error) throw error;
  return data;
}

// list pending join requests (owner only)
export async function listJoinRequests(groupId: string) {
  const { data, error } = await supabase.rpc("admin_list_join_requests", {
    p_group_id: groupId,
  });
  if (error) throw error;
  return data as { user_id: string; name: string | null; requested_at: string }[];
}

// approve a pending join request (owner only)
export async function approveJoin(groupId: string, userId: string) {
  const { data, error } = await supabase.rpc("admin_approve_join", {
    p_group_id: groupId,
    p_user_id: userId,
  });
  if (error) throw error;
  return data;
}

// reject a pending join request (owner only)
export async function rejectJoin(groupId: string, userId: string) {
  const { data, error } = await supabase.rpc("admin_reject_join", {
    p_group_id: groupId,
    p_user_id: userId,
  });
  if (error) throw error;
  return data;
}

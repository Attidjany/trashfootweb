// lib/groups.ts
import { supabase } from '@/lib/supabase';

// ---------- READ HELPERS ----------

export type GroupRow = {
  id: string;
  name: string;
  code: string | null;
  description?: string | null;
  created_at?: string | null;
};

export type MemberRow = {
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  status: 'approved' | 'pending';
  profile_name: string | null; // from profiles table
};

export async function listGroups(): Promise<GroupRow[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('id,name,code,description,created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getGroupById(groupId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select('id,name,code,description,created_at')
    .eq('id', groupId)
    .maybeSingle();
  if (error) throw error;
  return data as GroupRow | null;
}



export async function getGroupMembers(groupId: string): Promise<MemberRow[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      user_id,
      role,
      status,
      profiles:user_id ( name )
    `)
    .eq('group_id', groupId);
  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    user_id: r.user_id,
    role: r.role,
    status: r.status,
    profile_name: r.profiles?.name ?? null,
  })) as MemberRow[];
}

export async function amIMember(groupId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return { isMember: false, isAdmin: false, isOwner: false };

  const { data, error } = await supabase
    .from('group_members')
    .select('role,status')
    .eq('group_id', groupId)
    .eq('user_id', uid)
    .maybeSingle();
  if (error) throw error;

  const status = data?.status as 'approved' | 'pending' | undefined;
  const role = data?.role as 'owner' | 'admin' | 'member' | undefined;

  return {
    isMember: status === 'approved',
    isAdmin: role === 'admin' || role === 'owner',
    isOwner: role === 'owner',
    status,
  };
}

// ---------- MUTATIONS ----------

/** Create a group and make the creator owner */
export async function createGroupSupabase(name: string, description?: string | null) {
  if (!name.trim()) throw new Error('Group name required');
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) throw new Error('Not authenticated');

  // 1) create group
  const { data: g, error: ge } = await supabase
    .from('groups')
    .insert([{ name: name.trim(), description: description ?? null }])
    .select('id')
    .single();
  if (ge) throw ge;

  // 2) add creator as owner (status approved)
  const { error: me } = await supabase
    .from('group_members')
    .insert([{ group_id: g.id, user_id: uid, role: 'owner', status: 'approved' }]);
  if (me) throw me;

  return g.id as string;
}

/** Request to join a group by invite code (pending approval) */
export async function requestJoinByCode(code: string) {
  const clean = code.trim().toUpperCase();
  if (!clean) throw new Error('Code required');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  // Uses your existing RPC (you created earlier), or add it via SQL below.
  const { data, error } = await supabase.rpc('request_join_by_code', { p_code: clean });
  if (error) throw error;
  return data;
}

/** Request to join a group by its ID (no code) – needs SQL RPC below */
export async function requestJoinByGroupId(groupId: string) {
  const { data, error } = await supabase.rpc('request_join_by_group', { p_group_id: groupId });
  if (error) throw error;
  return data;
}

// ---------- ADMIN ACTIONS (need SQL RPC below) ----------

export async function listJoinRequests(groupId: string) {
  const { data, error } = await supabase.rpc('admin_list_join_requests', { p_group_id: groupId });
  if (error) throw error;
  // expected rows: { user_id, name, requested_at }
  return data as { user_id: string; name: string | null; requested_at: string }[];
}

export async function approveJoin(groupId: string, userId: string) {
  const { data, error } = await supabase.rpc('admin_approve_join', { p_group_id: groupId, p_user_id: userId });
  if (error) throw error;
  return data;
}

export async function rejectJoin(groupId: string, userId: string) {
  const { data, error } = await supabase.rpc('admin_reject_join', { p_group_id: groupId, p_user_id: userId });
  if (error) throw error;
  return data;
}

// lib/groups.ts (append)

export async function getMyGroups(): Promise<GroupRow[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return [];

  const { data, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      role,
      status,
      groups:group_id ( id, name, code, description, created_at )
    `)
    .eq('user_id', uid)
    .eq('status', 'approved');

  if (error) throw error;

  return (data ?? [])
    .map((r: any) => r.groups)
    .filter(Boolean) as GroupRow[];
}


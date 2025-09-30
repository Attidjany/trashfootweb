// lib/admin.ts
import { supabase } from '@/lib/supabase';

export async function isSuperAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_super_admin');
  if (error) throw error;
  return !!data;
}

export type AdminGroupRow = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_public: boolean;
  created_at: string | null;
  owner_id: string | null;
  members_count: number;
  pending_requests: number;
};

export async function adminListGroups(): Promise<AdminGroupRow[]> {
  const { data, error } = await supabase.rpc('admin_list_groups');
  if (error) throw error;
  return (data ?? []) as AdminGroupRow[];
}

export type AdminJoinReqRow = {
  group_id: string;
  group_name: string;
  user_id: string;
  username: string | null;
  requested_at: string | null;
};

export async function adminListJoinRequests(): Promise<AdminJoinReqRow[]> {
  const { data, error } = await supabase.rpc('admin_list_join_requests');
  if (error) throw error;
  return (data ?? []) as AdminJoinReqRow[];
}

export type AdminProfileRow = {
  id: string;
  username: string | null;
  gamehandle: string | null;
  name: string | null;
  created_at: string | null;
};

export async function adminListProfiles(): Promise<AdminProfileRow[]> {
  const { data, error } = await supabase.rpc('admin_list_profiles');
  if (error) throw error;
  return (data ?? []) as AdminProfileRow[];
}

export async function adminApproveRequest(groupId: string, userId: string) {
  const { error } = await supabase.rpc('admin_approve_request', {
    p_group_id: groupId,
    p_user_id: userId,
  });
  if (error) throw error;
}

export async function adminRejectRequest(groupId: string, userId: string) {
  const { error } = await supabase.rpc('admin_reject_request', {
    p_group_id: groupId,
    p_user_id: userId,
  });
  if (error) throw error;
}

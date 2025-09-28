import { supabase } from './supabase';

// Create a new group and return its join code
export async function createGroup(name: string) {
  const { data, error } = await supabase.rpc('create_group', { p_name: name });
  if (error) throw error;
  return data; // contains { id, name, code, owner, ... }
}

// Join an existing group by its code
export async function joinGroupByCode(code: string) {
  const { data, error } = await supabase.rpc('join_group_by_code', { p_code: code });
  if (error) throw error;
  return data; // contains group_id and role
}

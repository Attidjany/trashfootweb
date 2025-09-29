import { supabase } from '@/lib/supabase';

/** Create a pending join request by group code. */
export async function requestJoinByCode(code: string) {
  const { data, error } = await supabase.rpc('request_join_by_code', { p_code: code });
  if (error) throw error;
  return data; // the join_request row
}

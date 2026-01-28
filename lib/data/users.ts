/**
 * User Data Functions
 * Sync and manage users from Whop
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { User, UserInsert, UserUpdate } from '@/types/database';

/**
 * Get a user by their Whop user ID
 */
export async function getUserByWhopId(whopUserId: string): Promise<User | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('whop_user_id', whopUserId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get user: ${error.message}`);
  }

  return data;
}

/**
 * Get a user by their internal ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get user: ${error.message}`);
  }

  return data;
}

/**
 * Get or create a user from Whop data
 * This is the primary function for syncing users
 */
export async function getOrCreateUser(whopUser: {
  id: string;
  email?: string | null;
  name?: string | null;
  username?: string | null;
  profile_pic_url?: string | null;
}): Promise<User> {
  const supabase = createAdminClient();

  // Try to get existing user
  const existingUser = await getUserByWhopId(whopUser.id);

  if (existingUser) {
    // Update if any data changed
    const updates: UserUpdate = {};
    let hasUpdates = false;

    if (whopUser.email !== undefined && whopUser.email !== existingUser.email) {
      updates.email = whopUser.email;
      hasUpdates = true;
    }
    if (whopUser.name !== undefined && whopUser.name !== existingUser.name) {
      updates.name = whopUser.name;
      hasUpdates = true;
    }
    if (whopUser.username !== undefined && whopUser.username !== existingUser.username) {
      updates.username = whopUser.username;
      hasUpdates = true;
    }
    if (whopUser.profile_pic_url !== undefined && whopUser.profile_pic_url !== existingUser.profile_pic_url) {
      updates.profile_pic_url = whopUser.profile_pic_url;
      hasUpdates = true;
    }

    if (hasUpdates) {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', existingUser.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update user: ${error.message}`);
      }

      return data;
    }

    return existingUser;
  }

  // Create new user
  const newUser: UserInsert = {
    whop_user_id: whopUser.id,
    email: whopUser.email ?? null,
    name: whopUser.name ?? null,
    username: whopUser.username ?? null,
    profile_pic_url: whopUser.profile_pic_url ?? null,
  };

  const { data, error } = await supabase
    .from('users')
    .insert(newUser)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return data;
}

/**
 * Update a user's profile
 */
export async function updateUser(id: string, updates: UserUpdate): Promise<User> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return data;
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

/**
 * Get multiple users by their IDs
 */
export async function getUsersByIds(ids: string[]): Promise<User[]> {
  if (ids.length === 0) return [];

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to get users: ${error.message}`);
  }

  return data;
}

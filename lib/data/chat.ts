/**
 * Chat Data Functions
 * CRUD operations for chat messages
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { ChatMessage, ChatMessageInsert, ChatMessageUpdate } from '@/types/database';

// ============================================
// Chat Message CRUD
// ============================================

/**
 * Send a chat message
 */
export async function sendChatMessage(
  webinarId: string,
  registrationId: string,
  message: string
): Promise<ChatMessage> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      webinar_id: webinarId,
      registration_id: registrationId,
      message,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }

  return data;
}

/**
 * Get chat messages for a webinar
 */
export async function getChatMessages(
  webinarId: string,
  options?: {
    limit?: number;
    before?: string; // ISO timestamp for pagination
  }
): Promise<ChatMessage[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from('chat_messages')
    .select('*')
    .eq('webinar_id', webinarId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: true });

  if (options?.before) {
    query = query.lt('created_at', options.before);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }

  return data;
}

/**
 * Get recent chat messages (last N messages)
 */
export async function getRecentChatMessages(
  webinarId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('webinar_id', webinarId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }

  // Return in chronological order
  return data.reverse();
}

/**
 * Get pinned messages for a webinar
 */
export async function getPinnedMessages(webinarId: string): Promise<ChatMessage[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('webinar_id', webinarId)
    .eq('is_pinned', true)
    .eq('is_hidden', false)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get pinned messages: ${error.message}`);
  }

  return data;
}

/**
 * Pin/unpin a message
 */
export async function toggleMessagePin(
  messageId: string,
  isPinned: boolean
): Promise<ChatMessage> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .update({ is_pinned: isPinned })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update message: ${error.message}`);
  }

  return data;
}

/**
 * Hide/unhide a message (moderation)
 */
export async function toggleMessageHidden(
  messageId: string,
  isHidden: boolean
): Promise<ChatMessage> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .update({ is_hidden: isHidden })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update message: ${error.message}`);
  }

  return data;
}

/**
 * Delete a chat message
 */
export async function deleteChatMessage(messageId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    throw new Error(`Failed to delete message: ${error.message}`);
  }
}

/**
 * Get chat message count for a webinar
 */
export async function getChatMessageCount(webinarId: string): Promise<number> {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('webinar_id', webinarId)
    .eq('is_hidden', false);

  if (error) {
    throw new Error(`Failed to count messages: ${error.message}`);
  }

  return count || 0;
}

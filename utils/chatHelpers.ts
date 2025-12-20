// utils/chatHelpers.ts
import { UserProfile } from 'types/profile';
import { Chat } from 'types';

/**
 * Get the other participant in a conversation (not the current user)
 * @param chat - The chat object OR array of participants
 * @param currentUserId - The current user's ID
 * @returns The other participant or the first participant if not found
 */
export const getOtherParticipant = (
  chat: Chat | UserProfile[], 
  currentUserId: string
): UserProfile => {
  // Get participants array
  const participants = Array.isArray(chat) ? chat : chat.participants;
  
  // If no participants, return empty object (fallback)
  if (!participants || participants.length === 0) {
    return {} as UserProfile;
  }

  // Find the participant who is NOT the current user
  if (currentUserId) {
    const otherParticipant = participants.find(
      p => p._id !== currentUserId
    );
    if (otherParticipant) return otherParticipant;
  }
  
  // Fallback: return the first participant
  return participants[0];
};
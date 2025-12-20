

import { useCallback } from 'react';
import { Alert, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {  Message } from 'types';
export const useMessageActions = () => {
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      // Alert.alert('Copied', 'Message copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy message');
    }
  }, []);

  const handleCopyMessage = useCallback((message: string) => {
    copyToClipboard(message);
  }, [copyToClipboard]);

  const handleReplyToMessage = useCallback((message: Message) => {
    // You can implement your reply logic here
    // For example, set the reply context in your chat input
    // Alert.alert('Reply', `Replying to: "${message.message?.substring(0, 50)}..."`);
    // console.log('Replying to message:', message);
    return message
  }, []);

  const handleAIResponse = useCallback((message: Message) => {
    // You can implement your AI response logic here
    // For example, send the message to your AI service
    Alert.alert('AI Response', `Generating AI response for: "${message.message?.substring(0, 50)}..."`);
  }, []);

  const shareMessage = useCallback(async (message: string) => {
    try {
      await Share.share({
        message: message,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share message');
    }
  }, []);

  return {
    handleCopyMessage,
    handleReplyToMessage,
    handleAIResponse,
    shareMessage,
  };
};

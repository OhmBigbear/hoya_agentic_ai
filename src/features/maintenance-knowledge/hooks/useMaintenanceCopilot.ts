import { useEffect, useState } from 'react';
import * as maintenanceKnowledgeApi from '../services/maintenanceKnowledgeApi';
import type { ChatMessage } from '../types';

export function useMaintenanceCopilot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadInitialChatMessages() {
      const initialMessages = await maintenanceKnowledgeApi.getInitialChatMessages();

      if (!isMounted) {
        return;
      }

      setMessages(initialMessages);
    }

    void loadInitialChatMessages();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage = {
        id: messages.length + 1,
        role: 'user' as const,
        content: inputMessage,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      };
      setMessages([...messages, newMessage]);
      setInputMessage('');
    }
  };

  const handleSuggestedQuestionSelect = (question: string) => {
    setInputMessage(question);
  };

  return {
    messages,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    handleSuggestedQuestionSelect,
  };
}

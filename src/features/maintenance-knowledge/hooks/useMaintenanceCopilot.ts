import { useEffect, useState } from 'react';
import { APP_MODE } from '../../../shared/config/env';
import {
  getInitialChatMessages,
  sendMaintenanceChatMessage,
} from '../services/maintenanceKnowledgeApi';
import type { KBDocumentType } from '../dto';
import type { ChatMessage } from '../types';

interface UseMaintenanceCopilotOptions {
  selectedMachine: string;
  selectedDocType: string;
}

function formatChatTimestamp(value?: string) {
  const date = value ? new Date(value) : new Date();

  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function useMaintenanceCopilot({
  selectedMachine,
  selectedDocType,
}: UseMaintenanceCopilotOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialChatMessages() {
      const initialMessages = await getInitialChatMessages();

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

  const handleSendMessage = async () => {
    const messageText = inputMessage.trim();

    if (!messageText || isSending) {
      return;
    }

    const existingMessages = messages;
    const userMessage: ChatMessage = {
      id: existingMessages.length + 1,
      role: 'user',
      content: messageText,
      timestamp: formatChatTimestamp(),
    };

    setMessages([...existingMessages, userMessage]);
    setInputMessage('');
    setSendError(null);

    if (APP_MODE === 'mock') {
      return;
    }

    setIsSending(true);

    try {
      const response = await sendMaintenanceChatMessage({
        message: messageText,
        context: {
          machineId: selectedMachine,
          documentTypes: selectedDocType === 'all' ? undefined : [selectedDocType as KBDocumentType],
        },
        conversation: existingMessages.map((message) => ({
          messageId: String(message.id),
          role: message.role,
          content: message.content,
        })),
      });

      const assistantMessage: ChatMessage = {
        id: existingMessages.length + 2,
        role: response.message.role,
        content: response.message.content,
        timestamp: formatChatTimestamp(response.message.createdAt),
        confidence: response.message.confidence,
        sources: response.message.sources.map((source) => ({
          type: source.type,
          title: source.title,
          section: source.section,
          version: source.version,
          date: source.date ?? source.updatedAt,
        })),
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Failed to send maintenance chat message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestedQuestionSelect = (question: string) => {
    setInputMessage(question);
  };

  return {
    messages,
    inputMessage,
    isSending,
    sendError,
    setInputMessage,
    handleSendMessage,
    handleSuggestedQuestionSelect,
  };
}

import { ScrollArea } from '../../../app/components/ui/scroll-area';
import type { ChatMessage as ChatMessageType } from '../types';
import { ChatMessage } from './ChatMessage';

interface ChatMessageListProps {
  messages: ChatMessageType[];
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="space-y-6 max-w-4xl p-6">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
    </ScrollArea>
  );
}

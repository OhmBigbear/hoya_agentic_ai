import { Bot, User } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../types';
import { AssistantSources } from './AssistantSources';
import { ConfidenceFeedback } from './ConfidenceFeedback';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className="flex gap-4">
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        message.role === 'user' ? 'bg-slate-700' : 'bg-cyan-500/20'
      }`}>
        {message.role === 'user' ? (
          <User className="w-4 h-4 text-slate-300" />
        ) : (
          <Bot className="w-4 h-4 text-cyan-400" />
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white">
            {message.role === 'user' ? 'You' : 'AI Assistant'}
          </span>
          <span className="text-xs text-slate-500">{message.timestamp}</span>
        </div>

        {/* User Message */}
        {message.role === 'user' && (
          <div className="text-sm text-slate-300">
            {message.content}
          </div>
        )}

        {/* Assistant Message */}
        {message.role === 'assistant' && (
          <div>
            <div className="p-4 bg-[#141b2e] border border-white/10 rounded-lg">
              <div className="prose prose-sm prose-invert max-w-none">
                <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                  {message.content}
                </div>
              </div>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <AssistantSources sources={message.sources} />
              )}

              {/* Confidence Indicator */}
              {message.confidence && (
                <ConfidenceFeedback confidence={message.confidence} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

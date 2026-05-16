import { Send } from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';

interface ChatComposerProps {
  inputMessage: string;
  onInputMessageChange: (value: string) => void;
  onSendMessage: () => void;
}

export function ChatComposer({
  inputMessage,
  onInputMessageChange,
  onSendMessage,
}: ChatComposerProps) {
  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <Input
          value={inputMessage}
          onChange={(e) => onInputMessageChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSendMessage();
            }
          }}
          placeholder="Ask about procedures, safety warnings, troubleshooting steps, or historical repairs..."
          className="bg-[#1e293b] border-white/10 text-white placeholder:text-slate-500 min-h-[44px]"
        />
      </div>
      <Button
        onClick={onSendMessage}
        disabled={!inputMessage.trim()}
        className="bg-cyan-500 hover:bg-cyan-600 text-white h-[44px] px-6"
      >
        <Send className="w-4 h-4 mr-2" />
        Send
      </Button>
    </div>
  );
}

import { Badge } from '../../../app/components/ui/badge';
import { Sparkles, AlertCircle } from 'lucide-react';
import type { ChatMessage } from '../types';
import { ChatComposer } from './ChatComposer';
import { ChatMessageList } from './ChatMessageList';
import { SuggestedQuestions } from './SuggestedQuestions';

interface MaintenanceCopilotPanelProps {
  selectedMachine: string;
  messages: ChatMessage[];
  inputMessage: string;
  onInputMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onSuggestedQuestionSelect: (question: string) => void;
}

const machineLabels: Record<string, string> = {
  'curve-gen-3b': 'CURVE-GEN-3B',
  'polishing-7a': 'POLISHING-7A',
  'laser-engr-2c': 'LASER-ENGR-2C',
};

export function MaintenanceCopilotPanel({
  selectedMachine,
  messages,
  inputMessage,
  onInputMessageChange,
  onSendMessage,
  onSuggestedQuestionSelect,
}: MaintenanceCopilotPanelProps) {
  const selectedMachineLabel = machineLabels[selectedMachine] ?? selectedMachine.toUpperCase();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0f1623]">
      {/* Copilot Header */}
      <div className="shrink-0 p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Maintenance Knowledge Assistant</h3>
            <p className="text-xs text-slate-400">
              Ask questions about procedures, manuals, history, or troubleshooting
            </p>
          </div>
        </div>

        {/* Current Context Display */}
        <div className="mt-4 p-3 bg-[#141b2e] border border-white/10 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <AlertCircle className="w-3 h-3" />
            <span className="font-medium">Current Context:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
              {selectedMachineLabel}
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              Mechanical Failures
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              CURVE GENERATING Station
            </Badge>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <ChatMessageList messages={messages} />

      {/* Chat Input Area */}
      <div className="shrink-0 p-6 border-t border-white/10">
        {/* Suggested Questions */}
        <SuggestedQuestions onSuggestedQuestionSelect={onSuggestedQuestionSelect} />

        {/* Input Field */}
        <ChatComposer
          inputMessage={inputMessage}
          onInputMessageChange={onInputMessageChange}
          onSendMessage={onSendMessage}
        />

        <p className="text-xs text-slate-500 mt-2">
          AI responses reference machine manuals, SOPs, and historical maintenance data. Always verify critical procedures.
        </p>
      </div>
    </div>
  );
}

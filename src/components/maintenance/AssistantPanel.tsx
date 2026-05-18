import { AlertCircle, Bot, Loader2, Send, ShieldAlert, Sparkles } from 'lucide-react';
import { FormEvent } from 'react';
import { Badge } from '../../app/components/ui/badge';
import { Button } from '../../app/components/ui/button';
import { Progress } from '../../app/components/ui/progress';
import { Textarea } from '../../app/components/ui/textarea';
import type {
  MaintenanceKbChatResponse,
  MaintenanceKbContext,
  MaintenanceKbRelatedHistoryItem,
  MaintenanceKbSearchRequest,
} from '../../types/maintenanceKb';
import { RelatedHistoryPanel } from './RelatedHistoryPanel';
import { SourceReferencePanel } from './SourceReferencePanel';
import { SuggestedQuestions } from './SuggestedQuestions';

interface AssistantPanelProps {
  context?: MaintenanceKbContext;
  filters: MaintenanceKbSearchRequest;
  response: MaintenanceKbChatResponse | null;
  question: string;
  isLoading: boolean;
  error?: string | null;
  relatedHistory: MaintenanceKbRelatedHistoryItem[];
  onQuestionChange: (question: string) => void;
  onSendQuestion: () => void;
  onSelectQuestion: (question: string) => void;
}

export function AssistantPanel({
  context,
  filters,
  response,
  question,
  isLoading,
  error,
  relatedHistory,
  onQuestionChange,
  onSendQuestion,
  onSelectQuestion,
}: AssistantPanelProps) {
  const selected = context?.selected;
  const machine = getOptionLabel(context?.machines, filters.machine ?? selected?.machine);
  const station = getOptionLabel(context?.stations, filters.station ?? selected?.station);
  const failureType = getOptionLabel(context?.failure_types, filters.failure_type ?? selected?.failure_type);

  const submitQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSendQuestion();
  };

  return (
    <aside className="flex min-h-0 flex-1 flex-col bg-[#0f1623]">
      <div className="shrink-0 border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan-500/20 p-2">
            <Sparkles className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Maintenance Knowledge Assistant</h3>
            <p className="text-xs text-slate-400">Ask questions about procedures, manuals, history, or troubleshooting</p>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-white/10 bg-[#141b2e] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
            <AlertCircle className="h-3.5 w-3.5" />
            Current Context
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="border-cyan-500/30 bg-cyan-500/20 text-cyan-200">{machine}</Badge>
            <Badge className="border-blue-500/30 bg-blue-500/20 text-blue-200">{station}</Badge>
            <Badge className="border-purple-500/30 bg-purple-500/20 text-purple-200">{failureType}</Badge>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-5">
        {error ? (
          <div className="rounded-md border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">
            <div className="mb-1 font-medium">Error state</div>
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-md border border-dashed border-white/10 bg-[#101827] p-6 text-center">
            <div>
              <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-cyan-300" />
              <div className="font-medium text-white">Loading assistant response</div>
              <p className="mt-1 text-sm text-slate-400">Grounding the answer against maintenance evidence.</p>
            </div>
          </div>
        ) : response ? (
          <div className="space-y-4">
            <div className="rounded-md border border-white/10 bg-[#141b2e] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                <Bot className="h-4 w-4 text-cyan-300" />
                Chat Answer
              </div>
              <p className="whitespace-pre-line text-sm leading-6 text-slate-200">{response.answer}</p>
            </div>

            <ConfidenceBlock response={response} />
            <SourceReferencePanel sources={response.sources} />
            <SuggestedQuestions questions={response.suggested_questions} onSelectQuestion={onSelectQuestion} />
            <RelatedHistoryPanel history={relatedHistory} relatedDocuments={response.related_documents} />
          </div>
        ) : (
          <div className="flex min-h-[180px] items-center justify-center rounded-md border border-dashed border-white/10 bg-[#101827] p-6 text-center">
            <div>
              <Bot className="mx-auto mb-3 h-7 w-7 text-cyan-300" />
              <div className="font-medium text-white">Initial state</div>
              <p className="mt-1 max-w-sm text-sm text-slate-400">
                Ask a maintenance question to see a grounded answer with confidence, sources, and related documents.
              </p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={submitQuestion} className="shrink-0 border-t border-white/10 p-5">
        <div className="flex gap-2">
          <Textarea
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            placeholder="Ask about bearing replacement, spindle vibration, or PM schedule..."
            className="min-h-[44px] flex-1 border-white/10 bg-[#1e293b] text-white placeholder:text-slate-500"
          />
          <Button
            type="submit"
            disabled={isLoading || question.trim().length === 0}
            className="h-11 bg-[#00d4ff] px-4 font-medium text-[#0a0f1e] hover:bg-[#00b8e6]"
          >
            <Send className="mr-2 h-4 w-4" />
            Send
          </Button>
        </div>
      </form>
    </aside>
  );
}

function ConfidenceBlock({ response }: { response: MaintenanceKbChatResponse }) {
  const isLowConfidence = response.confidence_label === 'low' || response.confidence < 70;

  return (
    <div className="rounded-md border border-white/10 bg-[#101827] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase text-slate-400">Confidence Score</div>
        <Badge className={isLowConfidence ? 'border-amber-500/30 bg-amber-500/15 text-amber-200' : 'border-green-500/30 bg-green-500/15 text-green-200'}>
          {response.confidence_label.replace('_', ' ')}
        </Badge>
      </div>
      <Progress value={response.confidence} className="bg-slate-800 [&>div]:bg-cyan-400" />
      <div className="mt-2 text-sm font-semibold text-white">{response.confidence}%</div>
      {response.warnings.map((warning) => (
        <div key={warning} className="mt-2 flex gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 p-2 text-xs text-amber-100">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{warning}</span>
        </div>
      ))}
    </div>
  );
}

function getOptionLabel(options: Array<{ id: string; label: string }> | undefined, value: string | undefined): string {
  if (!value) {
    return 'Not selected';
  }

  return options?.find((option) => option.id === value)?.label ?? value;
}

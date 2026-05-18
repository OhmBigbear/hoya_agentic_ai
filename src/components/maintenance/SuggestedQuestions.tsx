import { Button } from '../../app/components/ui/button';
import type { MaintenanceKbSuggestedQuestion } from '../../types/maintenanceKb';

interface SuggestedQuestionsProps {
  questions: MaintenanceKbSuggestedQuestion[];
  onSelectQuestion: (question: string) => void;
}

export function SuggestedQuestions({ questions, onSelectQuestion }: SuggestedQuestionsProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase text-slate-400">Suggested Questions</h4>
      <div className="flex flex-wrap gap-2">
        {questions.map((question) => (
          <Button
            key={question.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectQuestion(question.question)}
            className="h-8 border-white/15 bg-[#141b2e] text-xs text-slate-300 hover:bg-[#1e293b] hover:text-white"
          >
            {question.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

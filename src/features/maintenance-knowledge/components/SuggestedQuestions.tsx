import { Button } from '../../../app/components/ui/button';

interface SuggestedQuestionsProps {
  onSuggestedQuestionSelect: (question: string) => void;
}

export function SuggestedQuestions({ onSuggestedQuestionSelect }: SuggestedQuestionsProps) {
  return (
    <div className="mb-4">
      <p className="text-xs text-slate-400 mb-2">Suggested questions:</p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7"
          onClick={() => onSuggestedQuestionSelect('Show maintenance history for this machine')}
        >
          Show maintenance history
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7"
          onClick={() => onSuggestedQuestionSelect('What are common failure modes?')}
        >
          Common failure modes
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7"
          onClick={() => onSuggestedQuestionSelect('Recommended preventive maintenance schedule?')}
        >
          PM schedule
        </Button>
      </div>
    </div>
  );
}

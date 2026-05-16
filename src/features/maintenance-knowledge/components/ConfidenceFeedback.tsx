import { CheckCircle, Copy, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Button } from '../../../app/components/ui/button';

interface ConfidenceFeedbackProps {
  confidence: number;
}

export function ConfidenceFeedback({ confidence }: ConfidenceFeedbackProps) {
  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3 h-3 text-green-400" />
          <span className="text-xs text-slate-400">Confidence Score:</span>
          <span className="text-xs font-semibold text-green-400">{confidence}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-6 px-2 text-slate-400 hover:text-green-400">
            <ThumbsUp className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-slate-400 hover:text-red-400">
            <ThumbsDown className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-slate-400 hover:text-cyan-400">
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

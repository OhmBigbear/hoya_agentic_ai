import { Badge } from '../../../app/components/ui/badge';
import { Card, CardContent } from '../../../app/components/ui/card';
import type { LessonLearned } from '../types';

interface LessonLearnedCardProps {
  lesson: LessonLearned;
}

export function LessonLearnedCard({ lesson }: LessonLearnedCardProps) {
  return (
    <Card className="bg-[#141b2e] border-white/10 hover:border-cyan-500/30 cursor-pointer transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs mb-2">
              {lesson.category}
            </Badge>
            <h4 className="text-sm font-medium text-white mb-2">{lesson.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-2">{lesson.summary}</p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>{lesson.author}</span>
              <span>•</span>
              <span>{lesson.date}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

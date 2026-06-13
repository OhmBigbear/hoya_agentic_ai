import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

const allowedMarkdownElements = [
  'blockquote',
  'br',
  'code',
  'h2',
  'h3',
  'hr',
  'li',
  'ol',
  'p',
  'strong',
  'ul',
];

interface CopilotMarkdownProps {
  content: string;
}

export function CopilotMarkdown({ content }: CopilotMarkdownProps) {
  return (
    <div className="copilot-markdown text-xs leading-relaxed text-slate-300">
      <ReactMarkdown
        allowedElements={allowedMarkdownElements}
        rehypePlugins={[rehypeSanitize]}
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          h2: ({ children }) => (
            <h2 className="mb-2 mt-3 border-b border-white/10 pb-1 text-sm font-semibold leading-snug text-white first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1.5 mt-3 text-[13px] font-semibold leading-snug text-cyan-100 first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-4 marker:text-cyan-300">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-4 marker:text-cyan-300">{children}</ol>,
          li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-cyan-400/50 bg-cyan-400/5 py-1 pl-3 text-slate-300">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded border border-cyan-300/20 bg-cyan-300/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-cyan-100">
              {children}
            </code>
          ),
          hr: () => <hr className="my-3 border-white/10" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

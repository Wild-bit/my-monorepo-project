import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const components: Components = {
  // 自定义代码块样式（语法高亮）
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match && !className;
    const language = match ? match[1] : '';

    if (isInline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded bg-white/10 text-purple-300 text-[0.85em] font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }

    // 获取代码文本内容
    const codeString = String(children).replace(/\n$/, '');

    return (
      <div className="relative group my-6 rounded-lg overflow-hidden">
        {language && (
          <div className="absolute top-0 left-0 px-3 py-1 text-[0.65rem] text-white/40 bg-white/5 rounded-br-lg border-r border-b border-white/5">
            {language}
          </div>
        )}
        <SyntaxHighlighter
          style={oneDark}
          language={language || 'text'}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: '#0d0d1a',
            borderRadius: 0,
            fontSize: '0.85rem',
            lineHeight: '1.7',
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  },
  // 自定义链接样式
  a({ children, href, ...props }) {
    return (
      <a
        href={href}
        className="text-purple-400 hover:text-purple-300 underline underline-offset-2 decoration-purple-400/30 hover:decoration-purple-400 transition-colors"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    );
  },
  // 自定义标题样式（用于锚点效果）
  h1({ children, id, ...props }) {
    return (
      <h1
        id={id}
        className="group scroll-mt-20 text-[1.8rem] font-bold tracking-tight mt-10 mb-4 text-white"
        {...props}
      >
        {children}
      </h1>
    );
  },
  h2({ children, id, ...props }) {
    return (
      <h2
        id={id}
        className="group scroll-mt-20 text-[1.4rem] font-semibold tracking-tight mt-8 mb-3 text-white"
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3({ children, id, ...props }) {
    return (
      <h3
        id={id}
        className="group scroll-mt-20 text-[1.15rem] font-semibold mt-6 mb-2 text-white"
        {...props}
      >
        {children}
      </h3>
    );
  },
  // 自定义引用块
  blockquote({ children, ...props }) {
    return (
      <blockquote
        className="border-l-2 border-purple-400/30 pl-5 my-5 text-white/50 italic"
        {...props}
      >
        {children}
      </blockquote>
    );
  },
  // 自定义表格
  table({ children, ...props }) {
    return (
      <div className="overflow-x-auto my-6">
        <table className="w-full border-collapse" {...props}>
          {children}
        </table>
      </div>
    );
  },
  th({ children, ...props }) {
    return (
      <th
        className="border border-white/10 bg-white/5 px-4 py-2 text-left text-[0.85rem] font-medium text-purple-300"
        {...props}
      >
        {children}
      </th>
    );
  },
  td({ children, ...props }) {
    return (
      <td
        className="border border-white/10 px-4 py-2 text-[0.85rem] text-white/70"
        {...props}
      >
        {children}
      </td>
    );
  },
  li({ children, ...props }) {
    return (
      <li className="my-1" {...props}>
        <span className="text-purple-400/50 hover:text-purple-400 mr-2">•</span>
        {children}
      </li>
    );
  },
};

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose-custom ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, rehypeAutolinkHeadings]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// 提取标题用于目录
export function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: number }[] = [];

  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1]?.length ?? 1;
    const text = match[2]?.trim() ?? '';
    // 生成 slug id（与 rehype-slug 保持一致）
    const id = text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');

    headings.push({ id, text, level });
  }

  return headings;
}

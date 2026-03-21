import { useState, useEffect, useCallback } from 'react';
import { List, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-24">
      {/* 移动端折叠按钮 */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden max-lg:flex items-center gap-2 text-sm text-white/50 hover:text-white mb-3 transition-colors"
      >
        <List className="w-4 h-4" />
        <span>目录</span>
        <ChevronRight
          className={cn(
            'w-4 h-4 transition-transform',
            !isCollapsed && 'rotate-90'
          )}
        />
      </button>

      {/* 目录列表 */}
      <nav
        className={cn(
          'max-lg:overflow-hidden max-lg:max-h-0 max-lg:transition-all max-lg:duration-300',
          !isCollapsed && 'max-lg:max-h-[500px]'
        )}
      >
        <h4 className="text-xs font-semibold uppercase tracking-[2px] text-white/30 mb-4">
          目录
        </h4>
        <ul className="space-y-1.5">
          {headings.map((heading) => (
            <li
              key={heading.id}
              style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
            >
              <button
                onClick={() => scrollToHeading(heading.id)}
                className={cn(
                  'text-[0.8rem] leading-snug text-left transition-all duration-200 py-1 px-2 rounded-md w-full',
                  activeId === heading.id
                    ? 'text-purple-400 bg-purple-400/10 font-medium'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                )}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

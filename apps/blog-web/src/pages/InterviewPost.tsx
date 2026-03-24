import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { interviewExperiences } from '@/data/blog-posts';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

export default function InterviewPost() {
  const navigate = useNavigate();

  // 获取所有分类
  const categories = useMemo(() => {
    const cats = new Set(interviewExperiences.map((post) => post.category).filter(Boolean) as string[]);
    return ['全部', ...Array.from(cats)];
  }, []);

  // 当前选中的分类
  const [activeCategory, setActiveCategory] = useState('全部');

  // 根据分类筛选文章
  const filteredPosts = useMemo(() => {
    const sortedPosts = interviewExperiences.sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));
    if (activeCategory === '全部') {
      return sortedPosts;
    }
    return sortedPosts.filter((post) => post.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="relative z-[1] container mx-auto px-6 sm:px-8 lg:px-16 pt-40 pb-20">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <span className="inline-block text-[0.7rem] font-semibold uppercase tracking-[2px] px-4 py-1.5 rounded-full glass text-purple-400">
          Interview
        </span>
        <h1 className="text-[2.5rem] font-bold tracking-[-1px] mt-4">
          面试经历
        </h1>
        <p className="text-white/50 mt-3 max-w-md mx-auto">
          分享面试经历与准备过程
        </p>
      </div>

      {/* 分类筛选 */}
      <div className="flex flex-wrap justify-start gap-3 mb-12">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              'transition-all duration-200 cursor-pointer',
              activeCategory === category
                ? 'scale-105'
                : 'opacity-60 hover:opacity-100'
            )}
          >
            <Badge
              variant="glass"
              className={cn(
                'cursor-pointer px-4 py-1.5 text-[0.8rem] font-medium rounded-full hover:bg-purple-400/20 transition-all duration-200 hover:border-purple-400 hover:text-purple-400',
                activeCategory === category ? 'bg-purple-400/20 border-purple-400 text-purple-400' : 'bg-purple-400/20 border-purple-400/30 text-purple-400'
              )}
            >
              {category}
            </Badge>
          </button>
        ))}
      </div>

      {/* 文章列表 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mx-auto">
        {filteredPosts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-white/40">
            暂无面试经历
          </div>
        ) : (
          filteredPosts.map((post, index) => (
            <article
              key={post.slug}
              onClick={() => navigate(`/interview/${post.slug}`)}
              className="group glass p-8 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/30 relative overflow-hidden"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* 背景装饰 */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* 日期 */}
              <time className="text-[0.75rem] text-pink-400 font-medium">
                {post.date}
              </time>

              {/* 标题 */}
              <h2 className="text-[1.15rem] font-semibold mt-3 mb-3 leading-snug group-hover:text-purple-300 transition-colors">
                {post.title}
              </h2>

              {/* 描述 */}
              <p className="text-[0.85rem] text-white/50 leading-relaxed line-clamp-2">
                {post.desc}
              </p>

              {/* 标签 */}
              {post.tags && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[0.65rem] px-2.5 py-1 rounded-full bg-purple-400/10 text-purple-400 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 阅读全文 */}
              <div className="flex items-center gap-2 mt-6 text-pink-400 text-[0.85rem] font-medium group-hover:gap-3 transition-all">
                <span>阅读全文</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

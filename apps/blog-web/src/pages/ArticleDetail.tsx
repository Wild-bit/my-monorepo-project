import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { getBlogPostBySlug, getInterviewExperienceBySlug } from '@/data/blog-posts';
import { MarkdownRenderer, extractHeadings } from '@/components/MarkdownRenderer';
import { TableOfContents } from '@/components/TableOfContents';

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isInterview = useLocation().pathname.includes('/interview');

  const post = slug ? isInterview ? getInterviewExperienceBySlug(slug) : getBlogPostBySlug(slug) : undefined;

  if (!post) {
    return (
      <div className="relative z-[1] container mx-auto px-6 pt-32 pb-20">
        <div className="text-center">
          <h1 className="text-[2rem] font-bold mb-4">文章不存在</h1>
          <button
            onClick={() => navigate('/blog')}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            返回博客列表
          </button>
        </div>
      </div>
    );
  }

  const headings = extractHeadings(post.content);

  return (
    <div className="relative z-[1] pt-24 pb-20">
      {/* 返回按钮和标题区域 */}
      <div className="container mx-auto px-6 sm:px-8 lg:px-16 mb-8">
        <button
          onClick={() => navigate('/blog')}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[0.85rem]">返回列表</span>
        </button>

        {/* 文章元信息 */}
        <header className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 text-[0.75rem] text-white/40 mb-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {post.date}
            </span>
            {post.tags && post.tags.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                {post.category}
              </span>
            )}
          </div>

          <h1 className="text-[2rem] sm:text-[2.5rem] font-bold tracking-tight leading-tight mb-4">
            {post.title}
          </h1>

          <p className="text-white/50 text-[1rem] leading-relaxed">
            {post.desc}
          </p>

          {/* 标签 */}
          {post.tags && (
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[0.7rem] px-3 py-1 rounded-full bg-purple-400/10 text-purple-400 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>
      </div>

      {/* 文章内容区域 - 三栏布局 */}
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        <div className="flex gap-8 lg:gap-12 max-w-7xl mx-auto">
          {/* 左侧 - 可选留空或放其他信息 */}
          {/* <aside className="hidden xl:block w-48 flex-shrink-0">
            <div className="sticky top-24">
              <div className="text-[0.7rem] text-white/30 space-y-2">
                <p>阅读本文</p>
                <p>约 {Math.ceil(post.content.split(/\s+/).length / 200)} 分钟</p>
              </div>
            </div>
          </aside> */}

          {/* 中间 - 文章内容 */}
          <main className="flex-1 min-w-0">
            <div className="glass p-6 sm:p-8 lg:p-10 rounded-xl">
              <MarkdownRenderer content={post.content} />
            </div>

            {/* 底部导航 */}
            <div className="mt-12 pt-8 border-t border-white/10 flex justify-between">
              <button
                onClick={() => navigate('/blog')}
                className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-[0.85rem]"
              >
                <ArrowLeft className="w-4 h-4" />
                返回博客列表
              </button>
            </div>
          </main>

          {/* 右侧 - 目录 */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <TableOfContents headings={headings} />
          </aside>
        </div>
      </div>
    </div>
  );
}

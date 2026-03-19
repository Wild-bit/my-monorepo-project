import { blogPosts } from '@/data/content';

export default function BlogSection() {
  return (
    <section id="blog" className="max-w-[960px] mx-auto px-8 py-20">
      <div className="text-center mb-12">
        <span className="inline-block text-[0.7rem] font-semibold uppercase tracking-[2px] px-4 py-1.5 rounded-full glass text-purple-400">
          Blog
        </span>
        <h2 className="text-[2rem] font-bold tracking-[-1px] mt-4">最新文章</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {blogPosts.map((post) => (
          <div
            key={post.title}
            className="glass p-7 transition-all cursor-pointer hover:-translate-y-1 hover:border-[rgba(244,114,182,0.3)]"
          >
            <div className="text-[0.7rem] text-pink-400 font-semibold mb-2">{post.date}</div>
            <h3 className="text-base font-semibold mb-2 leading-[1.4]">{post.title}</h3>
            <p className="text-[0.8rem] text-white/50 leading-relaxed">{post.desc}</p>
            <span className="inline-block mt-4 text-[0.8rem] text-pink-400 font-medium">
              阅读全文 →
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

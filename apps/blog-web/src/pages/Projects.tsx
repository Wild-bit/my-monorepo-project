import { projects } from '@/data/content';
import { ExternalLinkIcon } from 'lucide-react'

export default function ProjectsSection() {
  return (
    <section id="projects" className="container mx-auto px-6 sm:px-8 lg:px-16 py-20">
      <div className="mb-12 pt-20 text-center">
        <span className="inline-block text-[0.7rem] font-semibold uppercase tracking-[2px] px-4 py-1.5 rounded-full glass text-purple-400">
          Projects
        </span>
        <h2 className="text-[2rem] font-bold tracking-[-1px] mt-4">精选项目</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {projects.map((p) => (
          <div
            key={p.title}
            className="glass p-8 transition-all cursor-pointer hover:-translate-y-1 hover:border-[rgba(167,139,250,0.3)]"
          >
            <div className="text-[2rem] mb-4">{p.emoji}</div>
            <h3 className="text-[1.1rem] font-semibold mb-2">{p.title}</h3>
            <p className="text-[0.85rem] text-white/50 leading-[1.7]">{p.desc}</p>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {p.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[0.65rem] px-2.5 py-1 rounded-full bg-purple-400/10 text-purple-400 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            {p.tips && (
              <blockquote className="mt-5 border-l-2 border-purple-400/30 pl-5 text-white/35 italic text-[0.85rem] leading-relaxed">
                {p.tips}
              </blockquote>
            )}
            <div className="flex gap-2 mt-4 absolute top-4 right-4 items-center">
              {p.github && (
                <div className="flex items-center gap-2 bg-white/10 hover:bg-white/20 hover:scale-110 p-1 rounded-full transition-all">
                  <a href={p.github} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    <img src="static/images/github.svg" alt="GitHub" className="w-4 h-4" />
                  </a>
                </div>
              )}
              {p.website && (
                <div className="flex items-center gap-2 bg-white/10 hover:bg-white/20 hover:scale-110 p-1 rounded-full transition-all">
                  <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-[0.8rem] text-purple-400 font-medium" onClick={(e) => e.stopPropagation()}>
                    <ExternalLinkIcon className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

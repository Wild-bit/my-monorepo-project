import { projects } from '@/data/content';

export default function ProjectsSection() {
  return (
    <section id="projects" className="max-w-[960px] mx-auto px-8 py-20">
      <div className="text-center mb-12">
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
          </div>
        ))}
      </div>
    </section>
  );
}

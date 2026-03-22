import { experiences, skills } from '@/data/content';

interface Metric {
  label: string;
  before: string;
  after: string;
  improvement: string;
}

interface Highlight {
  title: string;
  tag: string;
  items: string[];
  metrics?: Metric[];
}

interface Experience {
  period: string;
  title: string;
  company: string;
  desc: string[];
  highlights?: Highlight[];
}

export default function ResumeSection() {
  return (
    <section id="resume" className="container mx-auto px-6 sm:px-8 lg:px-16 py-40">
      <div className="text-center mb-12">
        <span className="inline-block text-[0.7rem] font-semibold uppercase tracking-[2px] px-4 py-1.5 rounded-full glass text-purple-400">
          Resume
        </span>
        <h2 className="text-[2rem] font-bold tracking-[-1px] mt-4">工作经历</h2>
      </div>

      <div className="flex flex-col gap-4">
        {(experiences as Experience[]).map((exp) => (
          <div key={exp.period} className="glass p-7 flex gap-6 items-start">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 shrink-0 mt-1.5" />
            <div className="flex-1 min-w-0">
              <div className="text-base text-purple-400 font-semibold mb-1">{exp.period}</div>
              <h3 className="text-[1.05rem] font-semibold">{exp.title}</h3>
              <div className="text-base text-white/50 mb-1.5 mt-1">{exp.company}</div>
              <div className="flex items-center gap-3 mb-4 mt-5">
                <span className="text-base font-semibold uppercase tracking-[1.5px] text-purple-400/80">
                  职责概述
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-purple-500/30 to-transparent" />
              </div>
              <ul className="text-[0.85rem] text-white/50 leading-[1.7] list-disc list-inside">
                {exp.desc.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>

              {exp.highlights && (
                <div className="mt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-base font-semibold uppercase tracking-[1.5px] text-purple-400/80">
                      核心工作与成果
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-purple-500/30 to-transparent" />
                  </div>
                  <div className="flex flex-col gap-4">
                    {exp.highlights.map((h) => (
                      <div key={h.title} className="glass p-5 rounded-xl">
                        <div className="flex items-center gap-2.5 mb-3">
                          <h4 className="text-[0.95rem] font-semibold text-white/90">{h.title}</h4>
                          {/* <span className="text-[0.65rem] px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-medium border border-purple-500/20">
                            {h.tag}
                          </span> */}
                        </div>
                        <ul className="text-[0.82rem] text-white/55 leading-[1.8] list-disc list-inside">
                          {h.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>

                        {h.metrics && (
                          <div className="grid grid-cols-3 gap-3 mt-4">
                            {h.metrics.map((m) => (
                              <div
                                key={m.label}
                                className="text-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                              >
                                <div className="text-[0.7rem] text-white/40 mb-1.5">{m.label}</div>
                                <div className="text-[0.75rem] text-white/35 line-through mb-0.5">
                                  {m.before}
                                </div>
                                <div className="text-[1rem] font-bold text-purple-400">{m.after}</div>
                                <div className="text-[0.7rem] font-semibold text-emerald-400 mt-1">
                                  {m.improvement}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <h2 className="text-[2rem] font-bold tracking-[-1px]">技能栈</h2>
      </div>
      <div className="flex flex-wrap justify-center gap-2.5 mt-8">
        {skills.map((skill) => (
          <span
            key={skill.name}
            className="px-5 py-2 rounded-full text-[0.8rem] font-medium glass transition-all hover:border-[rgba(167,139,250,0.4)] hover:text-purple-400 flex items-center gap-2"
          >
            <img src={skill.icon} alt={skill.name} className="w-5 h-5 rounded bg-white/10" />
            {skill.name}
          </span>
        ))}
      </div>
    </section>
  );
}

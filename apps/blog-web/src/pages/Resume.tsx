import { experiences, skills } from '@/data/content';

export default function ResumeSection() {
  return (
    <section id="resume" className="container mx-auto px-6 sm:px-8 lg:px-16 py-20">
      <div className="text-center mb-12">
        <span className="inline-block text-[0.7rem] font-semibold uppercase tracking-[2px] px-4 py-1.5 rounded-full glass text-purple-400">
          Resume
        </span>
        <h2 className="text-[2rem] font-bold tracking-[-1px] mt-4">工作经历</h2>
      </div>

      <div className="flex flex-col gap-4">
        {experiences.map((exp) => (
          <div key={exp.period} className="glass p-7 flex gap-6 items-start">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 shrink-0 mt-1.5" />
            <div>
              <div className="text-[0.75rem] text-purple-400 font-semibold mb-1">{exp.period}</div>
              <h3 className="text-[1.05rem] font-semibold">{exp.title}</h3>
              <div className="text-[0.85rem] text-white/50 mb-1.5">{exp.company}</div>
              <p className="text-[0.85rem] text-white/50 leading-[1.7]">{exp.desc}</p>
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
            key={skill}
            className="px-5 py-2 rounded-full text-[0.8rem] font-medium glass transition-all hover:border-[rgba(167,139,250,0.4)] hover:text-purple-400"
          >
            {skill}
          </span>
        ))}
      </div>
    </section>
  );
}

import { skills } from '@/data/content';

const tools = [{ name: 'MacBook Air', icon: 'static/images/mac.svg' }, { name: 'Google Chrome', icon: 'static/images/google-chrome.svg' }, { name: 'Cursor', icon: 'static/images/cursor.svg' }, { name: 'Claude Code', icon: 'static/images/claude.svg' }];

const hobbies = [
  { text: '打游戏放松', emoji: '🎮' },
  { text: '写技术博客', emoji: '✍️' },
  { text: '探索新技术', emoji: '🚀' },
  { text: '打篮球', emoji: '🏀' },
];

export default function AboutMe() {
  return (
    <div className="relative z-[1] container mx-auto px-6 sm:px-8 lg:px-16 pt-32 pb-20">
      {/* ---- Know Who I'm ---- */}
      <section className="mb-28">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Left - Text */}
          <div className="flex-1 min-w-0">
            <h2 className="text-[2.2rem] font-bold tracking-[-1px] mb-10">
              关于 <span className="text-gradient">我</span>
            </h2>

            <div className="text-[1.05rem] leading-[2] text-white/70 space-y-4 max-w-[640px]">
              <p>
                大家好! 我是&nbsp;
                <span className="text-purple-400 font-semibold">赖振航</span>，来自&nbsp;
                <span className="text-purple-400 font-semibold">中国广州</span>。
                是一名&nbsp;
                <span className="text-purple-400 font-semibold">前端开发工程师</span>{' '}
                专注于现代 Web 应用开发，具备完整的前端到后端全栈项目经验。
              </p>
              <p>
                本科毕业于&nbsp;
                <span className="text-purple-400 font-semibold">华南理工大学广州学院</span>{' '}
                <span className="text-purple-400 font-semibold">网络工程</span>{' '}
                专业。
              </p>
              <p>
                目前正在积极寻找新的前端或全栈开发岗位机会。
              </p>
              <p>在个人技术成长方面，我持续通过开源项目提升工程能力，目前维护了两个完整的全栈项目：<span className="text-purple-400 font-semibold">多语言 i18n 管理平台</span>和<span className="text-purple-400 font-semibold">开发者导航工具平台</span>，以及 <span className="text-purple-400 font-semibold">个人博客网站</span>，这些项目帮助我积累了丰富的项目经验和技术能力。</p>
              <p>希望能够加入一个技术氛围良好的团队，持续提升工程能力并创造实际业务价值。</p>
              <p className="text-white/50">工作之余，我喜欢做一些让自己保持创造力的事情：</p>
            </div>

            <ul className="mt-5 space-y-3 text-[1.05rem] text-white/70">
              {hobbies.map((h) => (
                <li key={h.text} className="flex items-center gap-2.5">
                  <span className="text-purple-400 font-mono">{'>'}</span>
                  {h.text}
                  <span>{h.emoji}</span>
                </li>
              ))}
            </ul>

            <blockquote className="mt-10 border-l-2 border-purple-400/30 pl-5 text-white/35 italic text-[0.9rem] leading-relaxed">
              "学习某件事的最佳方法就是动手实践。"
              <br />
              <span className="not-italic text-white/25">— Lance</span>
            </blockquote>
          </div>

          {/* Right - Illustration */}
          <div className="w-full sm:w-[360px] lg:w-[460px] xl:w-[520px] flex-shrink-0">
            <img
              src="/static/images/about.png"
              alt="about illustration"
              className="w-full h-auto drop-shadow-[0_0_60px_rgba(124,58,237,0.2)]"
            />
          </div>
        </div>
      </section>

      {/* ---- Professional Skillset ---- */}
      <section className="mb-20 text-center">
        <h2 className="text-[2rem] font-bold tracking-[-1px] mb-10">
          专业 <span className="text-gradient">技能</span>
        </h2>

        <div className="flex flex-wrap justify-center gap-3 w-full mx-auto">
          {skills.map((skill) => (
            <span
              key={skill.name}
              className="glass px-5 py-2.5 rounded-full text-[0.85rem] font-medium flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:border-[rgba(167,139,250,0.4)] cursor-pointer"
            >
              {/* icon placeholder */}
              <img src={skill.icon} alt={skill.name} className="w-5 h-5 rounded bg-white/10" />
              {skill.name}
            </span>
          ))}
        </div>
      </section>

      {/* ---- Tools I Use ---- */}
      <section className="text-center">
        <h2 className="text-[2rem] font-bold tracking-[-1px] mb-10">
          <span className="text-gradient">工具</span> 与环境
        </h2>

        <div className="flex flex-wrap justify-center gap-3 max-w-[700px] mx-auto">
          {tools.map((tool) => (
            <span
              key={tool.name}
              className="glass px-5 py-2.5 rounded-full text-[0.85rem] font-medium flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:border-[rgba(167,139,250,0.4)] cursor-pointer"
            >
              <img src={tool.icon} alt={tool.name} className="w-5 h-5 rounded bg-white/10" />
              {tool.name}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

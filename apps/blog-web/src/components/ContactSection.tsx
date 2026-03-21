import { contactLinks } from '@/data/content';
import { CDN_URL } from '@/data/contant';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

const linkClass =
  'glass px-6 py-3 rounded-full flex items-center gap-2.5 text-[0.85rem] font-medium transition-all cursor-pointer hover:-translate-y-0.5 hover:border-[rgba(167,139,250,0.4)]';

export default function ContactSection() {
  return (
    <section id="contact" className="container mx-auto px-6 sm:px-8 lg:px-16 py-20 text-center">
      <span className="inline-block text-[0.7rem] font-semibold uppercase tracking-[2px] px-4 py-1.5 rounded-full glass text-purple-400">
        Contact
      </span>
      <h2 className="text-[2rem] font-bold tracking-[-1px] mt-4">联系我</h2>
      <p className="text-white/50 mb-10 max-w-[480px] mx-auto mt-4">
        如果你有合作意向、技术交流，欢迎随时联系我。
      </p>

      <div className="flex justify-center gap-4 flex-wrap">
        {contactLinks.map((c) =>
          c.type === 'wechat' ? (
            <HoverCard key={c.text} openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <span className={linkClass}>
                  <span className="text-[1.1rem]">{c.icon}</span>
                  {c.text}
                </span>
              </HoverCardTrigger>
              <HoverCardContent side="top" className="w-56">
                <img
                  src={`${CDN_URL}/images/wchat.jpg`}
                  alt="微信二维码"
                  className="w-full rounded-xl"
                />
                <p className="text-white/60 text-xs text-center mt-2">扫码添加，请备注来意</p>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <a
              key={c.text}
              href={c.link}
              target={c.link ? '_blank' : undefined}
              className={linkClass}
            >
              <span className="text-[1.1rem]">{c.icon}</span>
              {c.text}
            </a>
          ),
        )}
      </div>
    </section>
  );
}

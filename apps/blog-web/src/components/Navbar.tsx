import { navLinks } from '@/data/content';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const isActive = (href: string) => location.pathname === href;
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-8 py-3 rounded-full glass flex items-center gap-10">
      <a href="/" className="font-bold text-base text-gradient">Lance</a>
      <ul className="hidden sm:flex list-none gap-6">
        {navLinks.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className={cn("text-[0.8rem] text-white/50 font-medium transition-colors hover:text-white", isActive(link.href) && "text-white")}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
      <a href="https://github.com/Wild-bit/boya-stack/tree/main/apps/blog-web" target="_blank" rel="noopener noreferrer" className="text-[0.8rem] hover:scale-110 transition-all text-white/50 font-medium transition-colors hover:text-white">
        <img src="static/images/github.svg" alt="GitHub" className="w-4 h-4" />
      </a>
    </nav>
  );
}

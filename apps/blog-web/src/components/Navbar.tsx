import { navLinks } from '@/data/content';

export default function Navbar() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-8 py-3 rounded-full glass flex items-center gap-10">
      <a href="#about" className="font-bold text-base text-gradient">Lance</a>
      <ul className="hidden sm:flex list-none gap-6">
        {navLinks.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="text-[0.8rem] text-white/50 font-medium transition-colors hover:text-white"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

import HeroSection from '@/components/HeroSection';
import BlogSection from '@/components/BlogSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="relative z-[1]">
      <HeroSection />
      <BlogSection />
      <ContactSection />
      <Footer />
    </div>
  );
}

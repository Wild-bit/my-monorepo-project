import BackgroundOrbs from '@/components/BackgroundOrbs';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ProjectsSection from '@/components/ProjectsSection';
import ResumeSection from '@/components/ResumeSection';
import BlogSection from '@/components/BlogSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <BackgroundOrbs />
      <div className="relative z-[1]">
        <Navbar />
        <HeroSection />
        <ProjectsSection />
        <ResumeSection />
        <BlogSection />
        <ContactSection />
        <Footer />
      </div>
    </>
  );
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import AboutMe from '@/pages/AboutMe';
import Projects from '@/pages/Projects';
import Resume from '@/pages/Resume';
import BlogList from '@/pages/BlogList';
import ArticleDetail from '@/pages/ArticleDetail';
import BackgroundOrbs from '@/components/BackgroundOrbs';
import Navbar from '@/components/Navbar';

export default function App() {
  return (
    <BrowserRouter>
      <BackgroundOrbs />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutMe />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<ArticleDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

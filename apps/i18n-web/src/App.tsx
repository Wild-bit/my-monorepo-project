import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layouts/MainLayout';
import { HomePage } from './modules/home/pages/HomePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

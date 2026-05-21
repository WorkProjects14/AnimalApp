import { Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import RecaptchaGate from './components/RecaptchaGate';
import ExplorePage from './pages/ExplorePage';
import AnimalDetailPage from './pages/AnimalDetailPage';
import GeneratePage from './pages/GeneratePage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <RecaptchaGate>
      <div className="app-layout">
        <div className="app-content">
          <Routes>
            <Route path="/" element={<ExplorePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/animal/:id" element={<AnimalDetailPage />} />
            <Route path="/generate" element={<GeneratePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </RecaptchaGate>
  );
}

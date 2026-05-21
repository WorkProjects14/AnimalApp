import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="profile-page page-wrapper">
      <div className="profile-header animate-fade-in-up">
        <div className="profile-avatar animate-float">
          🦁
        </div>
        <h1>Animal Voice <span className="text-gradient">Safari</span></h1>
        <p className="text-muted">Your personal animal encyclopedia</p>
      </div>

      <div className="profile-cards stagger-children">
        <div className="profile-card glass-card-static animate-fade-in-up">
          <div className="profile-card-icon">📱</div>
          <div className="profile-card-content">
            <h3>App Version</h3>
            <p>1.0.0</p>
          </div>
        </div>

        <div className="profile-card glass-card-static animate-fade-in-up">
          <div className="profile-card-icon">🌍</div>
          <div className="profile-card-content">
            <h3>Explore</h3>
            <p>Browse animals from around the world</p>
          </div>
        </div>

        <div className="profile-card glass-card-static animate-fade-in-up">
          <div className="profile-card-icon">✨</div>
          <div className="profile-card-content">
            <h3>AI Generator</h3>
            <p>Create animals in 2D or 3D styles</p>
          </div>
        </div>

        <div className="profile-card glass-card-static animate-fade-in-up">
          <div className="profile-card-icon">🔊</div>
          <div className="profile-card-content">
            <h3>Animal Sounds</h3>
            <p>Listen to realistic animal sounds</p>
          </div>
        </div>

        {user && (
          <div className="profile-card glass-card-static animate-fade-in-up">
            <div className="profile-card-icon">👤</div>
            <div className="profile-card-content">
              <h3>Signed In</h3>
              <p>{user.email}</p>
            </div>
          </div>
        )}
      </div>

      <div className="profile-footer animate-fade-in-up">
        <p className="text-muted">
          Made with ❤️ for animal lovers
        </p>
        <p className="profile-copyright">
          © 2026 Animal Voice Safari
        </p>
      </div>
    </div>
  );
}

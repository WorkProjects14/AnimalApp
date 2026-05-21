import { NavLink, useLocation } from 'react-router-dom';
import './BottomNav.css';

const tabs = [
  { path: '/', icon: '🐾', label: 'Explore' },
  { path: '/generate', icon: '✨', label: 'Generate' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();

  // Hide bottom nav on admin page and animal detail page
  const hiddenPaths = ['/admin'];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;
  if (location.pathname.match(/^\/animal\/\d+$/)) return null;

  return (
    <nav className="bottom-nav" id="bottom-nav">
      <div className="bottom-nav-inner">
        {tabs.map((tab) => {
          const isActive = tab.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.path);

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`bottom-nav-tab ${isActive ? 'bottom-nav-tab--active' : ''}`}
              id={`nav-tab-${tab.label.toLowerCase()}`}
            >
              <span className="bottom-nav-icon">{tab.icon}</span>
              <span className="bottom-nav-label">{tab.label}</span>
              {isActive && <span className="bottom-nav-indicator" />}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

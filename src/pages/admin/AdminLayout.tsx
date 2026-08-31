import { Outlet, Link, NavLink } from 'react-router-dom';
import { BrandLockup } from '../../components/raffle/BrandLockup';
import { GitHubSyncStatus } from '../../components/admin/GitHubSyncStatus';
import './AdminLayout.css';

export function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-layout__sidebar">
        <div className="admin-layout__brand">
          <BrandLockup />
          <span className="admin-layout__brand-subtitle">Raffle Admin</span>
          <GitHubSyncStatus />
        </div>
        <nav className="admin-layout__nav">
          <NavLink
            to="/admin/raffles"
            className={({ isActive }) =>
              `admin-layout__nav-link${isActive ? ' admin-layout__nav-link--active' : ''}`
            }
          >
            Raffles
          </NavLink>
          <NavLink
            to="/admin/branding"
            className={({ isActive }) =>
              `admin-layout__nav-link${isActive ? ' admin-layout__nav-link--active' : ''}`
            }
          >
            Branding
          </NavLink>
        </nav>
        <Link to="/display" className="admin-layout__display-link">
          Open Display Mode →
        </Link>
      </aside>
      <main className="admin-layout__main">
        <Outlet />
      </main>
    </div>
  );
}

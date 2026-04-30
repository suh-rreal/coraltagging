import { Link, Outlet } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <header className="layout-header">
        <Link to="/" className="layout-brand">
          coral tagging
        </Link>
        <nav className="layout-nav" aria-label="Main">
          <Link to="/">coral map</Link>
          <Link to="/corals">all corals</Link>
        </nav>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from './Footer';
import { Avatar } from './ui';

// On the home page the header floats over the full-screen hero until the user scrolls.
function useOverlayHeader(enabled) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!enabled) return undefined;
    const update = () => setScrolled(window.scrollY > 40);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [enabled]);
  return enabled && !scrolled;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isHome = useLocation().pathname === '/';
  const transparent = useOverlayHeader(isHome);
  const canOrganize = user && ['organizer', 'admin'].includes(user.role);

  return (
    <>
      <header
        className={`header ${isHome ? 'header-fixed' : ''} ${transparent ? 'header-transparent' : ''}`}
      >
        <div className="container header-inner">
          <Link className="brand" to="/">
            Event<span>Flow</span>
          </Link>
          <nav className="nav">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/events">Explore</NavLink>
            <NavLink to="/about">About</NavLink>
            {user && <NavLink to="/account">My space</NavLink>}
            {canOrganize && <NavLink to="/organizer">Organizer</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <Link className="header-user" to="/account/profile">
                  <Avatar user={user} size={30} />
                  <span className="muted small d-none-sm">{user.name}</span>
                </Link>
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-sm" to="/login">
                  Log in
                </Link>
                <Link className="btn btn-sm btn-primary" to="/signup">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <Outlet />
      <Footer />
    </>
  );
}

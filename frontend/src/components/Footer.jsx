import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const categories = ['Technology', 'Music', 'Art', 'Food', 'Community'];

export default function Footer() {
  const { user } = useAuth();
  const canOrganize = user && ['organizer', 'admin'].includes(user.role);

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link className="brand" to="/">
            Event<span>Flow</span>
          </Link>
          <p className="muted small">
            Smart event management for colleges, communities, and small organizations. Publish
            events, take bookings, and keep attendees informed — all in one place.
          </p>
          <p className="muted small">Lahore, Pakistan · hello@eventflow.test</p>
        </div>

        <div>
          <h4>Explore</h4>
          <ul>
            <li>
              <Link to="/events">All events</Link>
            </li>
            {categories.map((category) => (
              <li key={category}>
                <Link to={`/events?category=${category}`}>{category}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Account</h4>
          <ul>
            {user ? (
              <>
                <li>
                  <Link to="/account">My bookings</Link>
                </li>
                <li>
                  <Link to="/account/notifications">Notifications</Link>
                </li>
                <li>
                  <Link to="/account/profile">Profile</Link>
                </li>
                <li>
                  <Link to="/account/support">Support</Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login">Log in</Link>
                </li>
                <li>
                  <Link to="/signup">Create an account</Link>
                </li>
                <li>
                  <Link to="/forgot-password">Reset password</Link>
                </li>
              </>
            )}
          </ul>
        </div>

        <div>
          <h4>Organize</h4>
          <ul>
            <li>
              <Link to={canOrganize ? '/organizer/new' : '/signup'}>Create an event</Link>
            </li>
            {canOrganize && (
              <li>
                <Link to="/organizer">Organizer studio</Link>
              </li>
            )}
            {user?.role === 'admin' && (
              <li>
                <Link to="/admin">Admin panel</Link>
              </li>
            )}
            <li>
              <Link to="/about">About EventFlow</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} EventFlow. All rights reserved.</span>
        <span>Govt. M.A.O Graduate College, Lahore · Built with the MERN stack</span>
      </div>
    </footer>
  );
}

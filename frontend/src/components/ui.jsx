import { NavLink } from 'react-router-dom';
import { assetUrl } from '../api';

const initialsOf = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

// Shows the uploaded picture when there is one, otherwise the user's initials.
export function Avatar({ user, size = 40, className = '' }) {
  const style = { width: size, height: size, fontSize: Math.max(size * 0.34, 11) };
  if (user?.avatar) {
    return (
      <img
        className={`avatar avatar-img ${className}`}
        style={style}
        src={assetUrl(user.avatar)}
        alt={user.name ? `${user.name}'s profile picture` : ''}
      />
    );
  }
  return (
    <span className={`avatar ${className}`} style={style} aria-hidden="true">
      {initialsOf(user?.name)}
    </span>
  );
}

const badgeTone = {
  confirmed: 'success',
  published: 'success',
  resolved: 'success',
  pending: 'warning',
  open: 'warning',
  cancelled: 'danger',
};

export const Badge = ({ status }) => (
  <span className={`badge badge-${badgeTone[status] || 'neutral'}`}>{status}</span>
);

export const Alert = ({ tone = 'error', children }) =>
  children ? <div className={`alert alert-${tone}`}>{children}</div> : null;

export const Empty = ({ children }) => <p className="empty">{children}</p>;

export const EmptyState = ({ icon, title, children, action }) => (
  <div className="empty-state">
    <span className="empty-state-icon">{icon}</span>
    <h3>{title}</h3>
    {children && <p className="muted">{children}</p>}
    {action}
  </div>
);

export const PageState = ({ children }) => <div className="page-state">{children}</div>;

export const Stat = ({ label, value }) => (
  <div className="card stat">
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value ?? '—'}</div>
  </div>
);

export const Field = ({ label, children }) => (
  <label className="field">
    <span>{label}</span>
    {children}
  </label>
);

// `header` replaces the plain title block; links may carry an icon and a count badge.
export function Dashboard({ title, subtitle, links, header, actions, children }) {
  return (
    <main className="container page">
      {header || (
        <div className="page-head">
          <div>
            <h1>{title}</h1>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="dashboard">
        <nav className="dashboard-nav" aria-label={`${title} sections`}>
          {links.map(({ to, end, icon, label, count }) => (
            <NavLink key={to} to={to} end={end}>
              {icon}
              <span>{label}</span>
              {count > 0 && <em className="nav-count">{count}</em>}
            </NavLink>
          ))}
        </nav>
        <div className="stack">{children}</div>
      </div>
    </main>
  );
}

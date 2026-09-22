import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  changePassword,
  createComplaint,
  listMyComplaints,
  updateUser,
  uploadAvatar,
} from '../api';
import { imageFor } from '../constants/eventImages';
import { useAuth } from '../context/AuthContext';
import { useAccount } from '../hooks/useAccount';
import { formatDate, formatDateTime, formatPrice } from '../utils/formatters';
import Icon from './Icon';
import { Alert, Avatar, Badge, Dashboard, EmptyState, Field, PageState } from './ui';

const NOTIFICATION_ICON = {
  booking_confirmed: 'ticket',
  booking_cancelled: 'bell',
  event_updated: 'calendar',
};

const countLabel = (count) => `${count} booking${count === 1 ? '' : 's'}`;

const relativeTime = (value) => {
  const minutes = Math.round((Date.now() - new Date(value)) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  if (minutes < 10080) return `${Math.round(minutes / 1440)}d ago`;
  return formatDate(value);
};

function BookingCard({ booking, onCancel, canCancel = true }) {
  const event = booking.event;
  if (!event) {
    return (
      <article className="booking-card booking-card--gone">
        <div className="booking-main">
          <h3>Event no longer available</h3>
          <p className="muted small">This event was removed by its organizer.</p>
        </div>
        <Badge status={booking.status} />
      </article>
    );
  }

  return (
    <article className="booking-card">
      <Link to={`/events/${event._id}`} className="booking-thumb">
        <img src={imageFor(event.category, event.image)} alt="" loading="lazy" />
      </Link>
      <div className="booking-main">
        <div className="booking-title-row">
          <h3>
            <Link to={`/events/${event._id}`}>{event.name}</Link>
          </h3>
          <Badge status={booking.status} />
        </div>
        <p className="booking-meta">
          <span>
            <Icon name="calendar" size={14} /> {formatDateTime(event.date)}
          </span>
          <span>
            <Icon name="pin" size={14} /> {event.location}
          </span>
        </p>
        <p className="booking-price">{formatPrice(event.price)}</p>
      </div>
      <div className="booking-actions">
        {booking.status === 'pending' && (
          <Link className="btn btn-sm btn-primary" to={`/bookings/${booking._id}/pay`}>
            Complete payment
          </Link>
        )}
        {canCancel && booking.status !== 'cancelled' && (
          <button
            className="btn btn-sm btn-danger"
            type="button"
            onClick={() =>
              window.confirm(`Cancel your booking for “${event.name}”?`) && onCancel(booking._id)
            }
          >
            Cancel
          </button>
        )}
      </div>
    </article>
  );
}

function Bookings({ bookings, onCancel }) {
  const now = Date.now();
  const [upcoming, past] = useMemo(() => {
    const active = bookings.filter((b) => b.status !== 'cancelled');
    return [
      active.filter((b) => !b.event || new Date(b.event.date) >= now),
      active.filter((b) => b.event && new Date(b.event.date) < now),
    ];
  }, [bookings, now]);
  const cancelled = bookings.filter((b) => b.status === 'cancelled');

  if (!bookings.length) {
    return (
      <EmptyState
        icon={<Icon name="ticket" size={32} />}
        title="No bookings yet"
        action={
          <Link className="btn btn-primary" to="/events">
            Browse events
          </Link>
        }
      >
        Reserve a seat and it will show up here with your ticket details.
      </EmptyState>
    );
  }

  return (
    <>
      <section className="card">
        <div className="card-header">
          <h2>Upcoming</h2>
          <span className="muted small">{countLabel(upcoming.length)}</span>
        </div>
        <div className="booking-list">
          {upcoming.length ? (
            upcoming.map((booking) => (
              <BookingCard key={booking._id} booking={booking} onCancel={onCancel} />
            ))
          ) : (
            <p className="empty">
              Nothing coming up.{' '}
              <Link className="btn-link" to="/events">
                Find an event
              </Link>
            </p>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section className="card">
          <div className="card-header">
            <h2>Past</h2>
            <span className="muted small">{countLabel(past.length)}</span>
          </div>
          <div className="booking-list">
            {past.map((booking) => (
              <BookingCard key={booking._id} booking={booking} canCancel={false} />
            ))}
          </div>
        </section>
      )}

      {cancelled.length > 0 && (
        <section className="card">
          <div className="card-header">
            <h2>Cancelled</h2>
            <span className="muted small">{countLabel(cancelled.length)}</span>
          </div>
          <div className="booking-list">
            {cancelled.map((booking) => (
              <BookingCard key={booking._id} booking={booking} canCancel={false} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Notifications({ notifications, unread, onRead, onReadAll }) {
  return (
    <section className="card">
      <div className="card-header">
        <h2>Notifications</h2>
        {unread > 0 && (
          <button className="btn btn-sm" type="button" onClick={onReadAll}>
            Mark all as read
          </button>
        )}
      </div>
      {notifications.length ? (
        <div className="list">
          {notifications.map((item) => (
            <div className={`notification-row ${item.readAt ? '' : 'is-unread'}`} key={item._id}>
              <span className="notification-icon">
                <Icon name={NOTIFICATION_ICON[item.type] || 'bell'} size={18} />
              </span>
              <div>
                <div className="list-item-title">{item.title}</div>
                <div className="list-item-meta">{item.message}</div>
              </div>
              <div className="notification-side">
                <span className="muted small">{relativeTime(item.createdAt)}</span>
                {!item.readAt && (
                  <button className="btn-link" type="button" onClick={() => onRead(item._id)}>
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Icon name="bell" size={32} />} title="No notifications">
          Booking confirmations and event updates will appear here.
        </EmptyState>
      )}
    </section>
  );
}

function AvatarField() {
  const { user, setUser } = useAuth();
  const [status, setStatus] = useState({ error: '', uploading: false });

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setStatus({ error: '', uploading: true });
    try {
      setUser(await uploadAvatar(file));
      setStatus({ error: '', uploading: false });
    } catch (requestError) {
      setStatus({ error: requestError.message, uploading: false });
    }
  }

  return (
    <div className="avatar-field">
      <div className="avatar-upload">
        <Avatar user={user} size={72} />
        <div>
          <label className="btn btn-sm" htmlFor="avatar-input">
            {status.uploading ? 'Uploading…' : user.avatar ? 'Change picture' : 'Upload picture'}
            <input id="avatar-input" type="file" accept="image/*" onChange={handleFile} />
          </label>
          <p className="muted small mt-1">JPG, PNG, or WebP up to 5 MB. Cropped to a square.</p>
        </div>
      </div>
      <Alert>{status.error}</Alert>
    </div>
  );
}

function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [status, setStatus] = useState({ message: '', error: '', saving: false });

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ message: '', error: '', saving: true });
    try {
      let updated = user;
      if (name.trim() !== user.name) updated = await updateUser(user._id, { name: name.trim() });
      if (passwords.currentPassword || passwords.newPassword) {
        if (!passwords.currentPassword || !passwords.newPassword) {
          throw new Error('Enter both your current and new password to change it.');
        }
        updated = await changePassword(passwords);
        setPasswords({ currentPassword: '', newPassword: '' });
      }
      setUser(updated);
      setStatus({ message: 'Profile updated.', error: '', saving: false });
    } catch (requestError) {
      setStatus({ message: '', error: requestError.message, saving: false });
    }
  }

  return (
    <>
      <section className="card">
        <div className="card-header">
          <h2>Profile picture</h2>
        </div>
        <div className="card-body">
          <AvatarField />
        </div>
      </section>

      <form className="card" onSubmit={handleSubmit}>
        <div className="card-header">
          <h2>Account details</h2>
        </div>
        <div className="card-body stack">
          <div className="form-row">
            <Field label="Full name">
              <input
                className="input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </Field>
            <Field label="Email address">
              <input className="input" value={user.email} disabled />
            </Field>
          </div>

          <div className="form-divider">
            <h3>Change password</h3>
            <p className="muted small">Leave blank to keep your current password.</p>
          </div>
          <div className="form-row">
            <Field label="Current password">
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                value={passwords.currentPassword}
                onChange={(event) =>
                  setPasswords({ ...passwords, currentPassword: event.target.value })
                }
              />
            </Field>
            <Field label="New password">
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                minLength="8"
                value={passwords.newPassword}
                onChange={(event) =>
                  setPasswords({ ...passwords, newPassword: event.target.value })
                }
              />
            </Field>
          </div>

          <Alert tone="success">{status.message}</Alert>
          <Alert>{status.error}</Alert>
        </div>
        <div className="card-footer">
          <button className="btn btn-primary" type="submit" disabled={status.saving}>
            {status.saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </>
  );
}

function Support() {
  const [complaints, setComplaints] = useState([]);
  const [form, setForm] = useState({ subject: '', description: '' });
  const [status, setStatus] = useState({ message: '', error: '', saving: false });

  useEffect(() => {
    listMyComplaints()
      .then(setComplaints)
      .catch((requestError) => setStatus((s) => ({ ...s, error: requestError.message })));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ message: '', error: '', saving: true });
    try {
      setComplaints([await createComplaint(form), ...complaints]);
      setForm({ subject: '', description: '' });
      setStatus({ message: 'Thanks — our team will look into it.', error: '', saving: false });
    } catch (requestError) {
      setStatus({ message: '', error: requestError.message, saving: false });
    }
  }

  return (
    <>
      <form className="card" onSubmit={handleSubmit}>
        <div className="card-header">
          <h2>Contact support</h2>
        </div>
        <div className="card-body stack">
          <Field label="Subject">
            <input
              className="input"
              maxLength="150"
              placeholder="Briefly, what is the issue?"
              value={form.subject}
              onChange={(event) => setForm({ ...form, subject: event.target.value })}
              required
            />
          </Field>
          <Field label="Description">
            <textarea
              className="input"
              maxLength="2000"
              placeholder="Tell us what happened, including the event name if relevant."
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              required
            />
          </Field>
          <Alert tone="success">{status.message}</Alert>
          <Alert>{status.error}</Alert>
        </div>
        <div className="card-footer">
          <button className="btn btn-primary" type="submit" disabled={status.saving}>
            {status.saving ? 'Sending…' : 'Submit request'}
          </button>
        </div>
      </form>

      <section className="card">
        <div className="card-header">
          <h2>Your requests</h2>
          <span className="muted small">{complaints.length}</span>
        </div>
        {complaints.length ? (
          <div className="list">
            {complaints.map((complaint) => (
              <div className="list-item" key={complaint._id}>
                <div>
                  <div className="list-item-title">{complaint.subject}</div>
                  <div className="list-item-meta">{complaint.description}</div>
                  {complaint.resolution && (
                    <p className="resolution">
                      <Icon name="shield" size={14} /> {complaint.resolution}
                    </p>
                  )}
                </div>
                <div className="notification-side">
                  <Badge status={complaint.status} />
                  <span className="muted small">{formatDate(complaint.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Icon name="shield" size={32} />} title="No requests yet">
            If something goes wrong with a booking, let us know here.
          </EmptyState>
        )}
      </section>
    </>
  );
}

export default function AccountPage() {
  const { user } = useAuth();
  const params = useParams();
  const section = ['notifications', 'profile', 'support'].includes(params.section)
    ? params.section
    : 'bookings';
  const flash = useLocation().state?.message;
  const account = useAccount();

  const unread = account.notifications.filter((item) => !item.readAt).length;
  const active = account.bookings.filter((b) => b.status !== 'cancelled');
  const upcoming = active.filter((b) => b.event && new Date(b.event.date) >= Date.now()).length;
  const awaitingPayment = account.bookings.filter((b) => b.status === 'pending').length;

  const links = [
    { to: '/account', label: 'Bookings', end: true, icon: <Icon name="ticket" size={16} /> },
    {
      to: '/account/notifications',
      label: 'Notifications',
      icon: <Icon name="bell" size={16} />,
      count: unread,
    },
    { to: '/account/profile', label: 'Profile', icon: <Icon name="users" size={16} /> },
    { to: '/account/support', label: 'Support', icon: <Icon name="shield" size={16} /> },
  ];

  const header = (
    <header className="account-hero card">
      <Avatar user={user} size={64} />
      <div className="account-hero-id">
        <h1>{user.name}</h1>
        <p className="muted small">{user.email}</p>
        <Badge status={user.role} />
      </div>
      <dl className="account-hero-stats">
        <div>
          <dt>Upcoming</dt>
          <dd>{upcoming}</dd>
        </div>
        <div>
          <dt>Awaiting payment</dt>
          <dd>{awaitingPayment}</dd>
        </div>
        <div>
          <dt>Unread</dt>
          <dd>{unread}</dd>
        </div>
      </dl>
    </header>
  );

  return (
    <Dashboard title="My space" links={links} header={header}>
      <Alert tone="success">{flash}</Alert>
      <Alert>{account.error}</Alert>
      {account.loading ? (
        <PageState>Loading your account…</PageState>
      ) : (
        <>
          {section === 'bookings' && (
            <Bookings bookings={account.bookings} onCancel={account.cancel} />
          )}
          {section === 'notifications' && (
            <Notifications
              notifications={account.notifications}
              unread={unread}
              onRead={account.markRead}
              onReadAll={account.markAllRead}
            />
          )}
          {section === 'profile' && <Profile />}
          {section === 'support' && <Support />}
        </>
      )}
    </Dashboard>
  );
}

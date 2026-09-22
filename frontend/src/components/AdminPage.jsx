import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  approveEvent,
  deleteEvent,
  deleteUser,
  getAdminOverview,
  listAdminBookings,
  listAdminComplaints,
  listAdminEvents,
  listUsers,
  resolveComplaint,
  updateUser,
} from '../api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime } from '../utils/formatters';
import { Alert, Avatar, Badge, Dashboard, Empty, PageState, Stat } from './ui';

const links = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/events', label: 'Events' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/complaints', label: 'Complaints' },
];
const roles = ['user', 'organizer', 'admin'];

const loaders = {
  overview: async () => {
    const [overview, events, complaints] = await Promise.all([
      getAdminOverview(),
      listAdminEvents({ status: 'pending' }),
      listAdminComplaints({ status: 'open' }),
    ]);
    return { overview, events, complaints };
  },
  events: async () => ({ events: await listAdminEvents() }),
  bookings: async () => ({ bookings: await listAdminBookings() }),
  users: async () => ({ users: await listUsers() }),
  complaints: async () => ({ complaints: await listAdminComplaints() }),
};

function Section({ title, count, children }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>{title}</h2>
        <span className="muted small">{count}</span>
      </div>
      {children}
    </div>
  );
}

function EventRows({ events, onApprove, onDelete }) {
  if (!events.length) return <Empty>No events.</Empty>;
  return events.map((event) => (
    <div className="list-item" key={event._id}>
      <div>
        <div className="list-item-title">
          {event.status === 'published' ? (
            <Link to={`/events/${event._id}`}>{event.name}</Link>
          ) : (
            event.name
          )}
        </div>
        <div className="list-item-meta">
          {event.category} · {formatDate(event.date)} · {event.location} · by{' '}
          {event.organizer?.name || '—'} · {event.bookedSeats}/{event.capacity} booked
        </div>
      </div>
      <div className="list-item-actions">
        <Badge status={event.status} />
        {event.status === 'pending' && (
          <button
            className="btn btn-sm btn-primary"
            type="button"
            onClick={() => onApprove(event._id)}
          >
            Approve
          </button>
        )}
        <button className="btn-link danger" type="button" onClick={() => onDelete(event)}>
          Delete
        </button>
      </div>
    </div>
  ));
}

function ComplaintRows({ complaints, onResolve }) {
  const [resolving, setResolving] = useState(null);
  const [resolution, setResolution] = useState('');

  if (!complaints.length) return <Empty>No complaints.</Empty>;
  return complaints.map((complaint) => (
    <div key={complaint._id}>
      <div className="list-item">
        <div>
          <div className="list-item-title">{complaint.subject}</div>
          <div className="list-item-meta">
            {complaint.submittedBy?.email || 'User'} · {formatDate(complaint.createdAt)}
          </div>
          <p className="small mt-1">{complaint.description}</p>
          {complaint.resolution && (
            <p className="small muted mt-1">Resolution: {complaint.resolution}</p>
          )}
        </div>
        <div className="list-item-actions">
          <Badge status={complaint.status} />
          {complaint.status === 'open' && resolving !== complaint._id && (
            <button
              className="btn btn-sm"
              type="button"
              onClick={() => setResolving(complaint._id)}
            >
              Resolve
            </button>
          )}
        </div>
      </div>
      {resolving === complaint._id && (
        <form
          className="list-detail row"
          onSubmit={async (event) => {
            event.preventDefault();
            await onResolve(complaint._id, resolution);
            setResolving(null);
            setResolution('');
          }}
        >
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder="How was this resolved?"
            value={resolution}
            onChange={(event) => setResolution(event.target.value)}
            maxLength="2000"
            required
          />
          <button className="btn btn-primary" type="submit">
            Save
          </button>
          <button className="btn" type="button" onClick={() => setResolving(null)}>
            Cancel
          </button>
        </form>
      )}
    </div>
  ));
}

export default function AdminPage() {
  const { user: me } = useAuth();
  const { section = 'overview' } = useParams();
  const active = loaders[section] ? section : 'overview';
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await loaders[active]());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [active]);

  useEffect(() => {
    load();
  }, [load]);

  const run = (task) => task.then(load).catch((requestError) => setError(requestError.message));
  const handleApprove = (id) => run(approveEvent(id));
  const handleDeleteEvent = (event) =>
    window.confirm(`Delete “${event.name}”?`) && run(deleteEvent(event._id));
  const handleResolve = (id, resolution) => run(resolveComplaint(id, resolution));
  const handleRole = (user, role) => run(updateUser(user._id, { role }));
  const handleDeleteUser = (user) =>
    window.confirm(`Delete ${user.email}? This cannot be undone.`) && run(deleteUser(user._id));

  const { overview, events = [], bookings = [], users = [], complaints = [] } = data;

  return (
    <Dashboard
      title="Admin panel"
      subtitle="Approve events, manage users, and resolve complaints."
      links={links}
    >
      <Alert>{error}</Alert>
      {loading ? (
        <PageState>Loading…</PageState>
      ) : (
        <>
          {active === 'overview' && (
            <>
              <div className="grid-stats">
                <Stat label="Users" value={overview?.users} />
                <Stat label="Published events" value={overview?.events} />
                <Stat label="Active bookings" value={overview?.bookings} />
                <Stat label="Open complaints" value={overview?.openComplaints} />
              </div>
              <Section title="Awaiting approval" count={`${events.length} pending`}>
                <div className="list">
                  <EventRows
                    events={events}
                    onApprove={handleApprove}
                    onDelete={handleDeleteEvent}
                  />
                </div>
              </Section>
              <Section title="Open complaints" count={`${complaints.length} open`}>
                <div className="list">
                  <ComplaintRows complaints={complaints} onResolve={handleResolve} />
                </div>
              </Section>
            </>
          )}

          {active === 'events' && (
            <Section title="All events" count={`${events.length} total`}>
              <div className="list">
                <EventRows events={events} onApprove={handleApprove} onDelete={handleDeleteEvent} />
              </div>
            </Section>
          )}

          {active === 'bookings' && (
            <Section title="All bookings" count={`${bookings.length} total`}>
              <div className="list">
                {bookings.length ? (
                  bookings.map((booking) => (
                    <div className="list-item" key={booking._id}>
                      <div>
                        <div className="list-item-title">
                          {booking.event?.name || 'Event removed'}
                        </div>
                        <div className="list-item-meta">
                          {booking.user?.name} ({booking.user?.email}) ·{' '}
                          {formatDateTime(booking.createdAt)}
                        </div>
                      </div>
                      <Badge status={booking.status} />
                    </div>
                  ))
                ) : (
                  <Empty>No bookings yet.</Empty>
                )}
              </div>
            </Section>
          )}

          {active === 'users' && (
            <Section title="All users" count={`${users.length} total`}>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <span className="cell-user">
                            <Avatar user={user} size={28} />
                            {user.name}
                          </span>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <select
                            className="input"
                            value={user.role}
                            disabled={user._id === me._id}
                            onChange={(event) => handleRole(user, event.target.value)}
                            aria-label={`Role for ${user.email}`}
                          >
                            {roles.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          {user._id !== me._id && (
                            <button
                              className="btn-link danger"
                              type="button"
                              onClick={() => handleDeleteUser(user)}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {active === 'complaints' && (
            <Section title="All complaints" count={`${complaints.length} total`}>
              <div className="list">
                <ComplaintRows complaints={complaints} onResolve={handleResolve} />
              </div>
            </Section>
          )}
        </>
      )}
    </Dashboard>
  );
}

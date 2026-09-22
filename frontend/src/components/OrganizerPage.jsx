import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createEvent, deleteEvent, listEventBookings, listMyEvents, updateEvent } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, formatPrice } from '../utils/formatters';
import EventForm from './EventForm';
import { Alert, Avatar, Badge, Dashboard, Empty, PageState, Stat } from './ui';

const links = [
  { to: '/organizer', label: 'Overview', end: true },
  { to: '/organizer/events', label: 'My events' },
  { to: '/organizer/new', label: 'Create event' },
];

function Registrations({ eventId }) {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listEventBookings(eventId)
      .then(setBookings)
      .catch((requestError) => setError(requestError.message));
  }, [eventId]);

  if (error) return <Alert>{error}</Alert>;
  if (!bookings) return <p className="muted small">Loading registrations…</p>;
  if (!bookings.length) return <p className="muted small">No registrations yet.</p>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Attendee</th>
            <th>Email</th>
            <th>Status</th>
            <th>Booked</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking._id}>
              <td>
                <span className="cell-user">
                  <Avatar user={booking.user} size={28} />
                  {booking.user?.name}
                </span>
              </td>
              <td>{booking.user?.email}</td>
              <td>
                <Badge status={booking.status} />
              </td>
              <td>{formatDateTime(booking.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventList({ events, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(null);
  if (!events.length) {
    return (
      <Empty>
        No events yet.{' '}
        <Link className="btn-link" to="/organizer/new">
          Create your first event
        </Link>
      </Empty>
    );
  }
  return events.map((event) => (
    <div key={event._id}>
      <div className="list-item">
        <div>
          <div className="list-item-title">
            {event.status === 'published' ? (
              <Link to={`/events/${event._id}`}>{event.name}</Link>
            ) : (
              event.name
            )}
          </div>
          <div className="list-item-meta">
            {formatDateTime(event.date)} · {event.location} · {formatPrice(event.price)} ·{' '}
            {event.bookedSeats}/{event.capacity} booked
          </div>
        </div>
        <div className="list-item-actions">
          <Badge status={event.status} />
          <button
            className="btn-link"
            type="button"
            onClick={() => setExpanded(expanded === event._id ? null : event._id)}
          >
            {expanded === event._id ? 'Hide' : 'Registrations'}
          </button>
          <button className="btn-link" type="button" onClick={() => onEdit(event)}>
            Edit
          </button>
          <button className="btn-link danger" type="button" onClick={() => onDelete(event)}>
            Delete
          </button>
        </div>
      </div>
      {expanded === event._id && (
        <div className="list-detail">
          <Registrations eventId={event._id} />
        </div>
      )}
    </div>
  ));
}

export default function OrganizerPage() {
  const { user } = useAuth();
  const { section = 'overview' } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState(null);
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState({ message: '', error: '' });

  useEffect(() => {
    listMyEvents()
      .then(setEvents)
      .catch((requestError) => setStatus({ message: '', error: requestError.message }));
  }, []);

  async function handleCreate(data) {
    const created = await createEvent(data);
    setEvents([...events, created]);
    setStatus({
      message:
        created.status === 'published'
          ? `“${created.name}” is live on the calendar.`
          : `“${created.name}” was submitted for admin approval.`,
      error: '',
    });
    navigate('/organizer/events');
  }

  async function handleUpdate(data) {
    const updated = await updateEvent(editing._id, data);
    setEvents(events.map((event) => (event._id === updated._id ? updated : event)));
    setEditing(null);
    setStatus({ message: `“${updated.name}” updated. Attendees have been notified.`, error: '' });
  }

  async function handleDelete(event) {
    if (!window.confirm(`Delete “${event.name}”? This cannot be undone.`)) return;
    try {
      await deleteEvent(event._id);
      setEvents(events.filter((item) => item._id !== event._id));
      setStatus({ message: `“${event.name}” deleted.`, error: '' });
    } catch (requestError) {
      setStatus({ message: '', error: requestError.message });
    }
  }

  const sorted = events ? [...events].sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
  const booked = sorted.reduce((sum, event) => sum + event.bookedSeats, 0);
  const pending = sorted.filter((event) => event.status === 'pending').length;

  return (
    <Dashboard
      title="Organizer studio"
      subtitle="Create events, track registrations, and keep attendees informed."
      links={links}
    >
      <Alert tone="success">{status.message}</Alert>
      <Alert>{status.error}</Alert>
      {!events ? (
        <PageState>Loading…</PageState>
      ) : editing ? (
        <>
          <h2>Edit “{editing.name}”</h2>
          <EventForm
            key={editing._id}
            event={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        </>
      ) : section === 'new' ? (
        <>
          <div>
            <h2>Create event</h2>
            <p className="muted small">
              {user.role === 'admin'
                ? 'Events you create are published immediately.'
                : 'New events are reviewed by an admin before they appear on the calendar.'}
            </p>
          </div>
          <EventForm onSubmit={handleCreate} />
        </>
      ) : section === 'events' ? (
        <div className="card">
          <div className="card-header">
            <h2>My events</h2>
            <Link className="btn btn-sm btn-primary" to="/organizer/new">
              New event
            </Link>
          </div>
          <div className="list">
            <EventList events={sorted} onEdit={setEditing} onDelete={handleDelete} />
          </div>
        </div>
      ) : (
        <>
          <div className="grid-stats">
            <Stat label="Events" value={sorted.length} />
            <Stat label="Awaiting approval" value={pending} />
            <Stat label="Seats booked" value={booked} />
          </div>
          <div className="card">
            <div className="card-header">
              <h2>Upcoming</h2>
              <Link className="btn-link" to="/organizer/events">
                View all
              </Link>
            </div>
            <div className="list">
              <EventList
                events={sorted.filter((event) => new Date(event.date) > new Date()).slice(0, 5)}
                onEdit={setEditing}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </>
      )}
    </Dashboard>
  );
}

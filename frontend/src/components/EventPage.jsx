import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createBooking, getEvent, getEventFeedback, listBookings } from '../api';
import { galleryFor, imageFor } from '../constants/eventImages';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, formatPrice } from '../utils/formatters';
import EventFeedback from './EventFeedback';
import Icon from './Icon';
import { Alert, Avatar, PageState } from './ui';

function Fact({ icon, label, children }) {
  return (
    <div className="fact">
      <Icon name={icon} size={20} />
      <span className="fact-label">{label}</span>
      <span>{children}</span>
    </div>
  );
}

function BookingAction({ event, myBooking, seatsLeft, isPast, user, busy, onBook }) {
  if (isPast) return <p className="muted">This event has ended.</p>;
  if (myBooking?.status === 'confirmed') {
    return (
      <>
        <Alert tone="success">Your seat is confirmed.</Alert>
        <Link className="btn" to="/account">
          View my bookings
        </Link>
      </>
    );
  }
  if (myBooking) {
    return (
      <>
        <Alert tone="warning">Your seat is reserved — complete payment to confirm it.</Alert>
        <Link className="btn btn-primary" to={`/bookings/${myBooking._id}/pay`}>
          Pay {formatPrice(event.price)}
        </Link>
      </>
    );
  }
  if (seatsLeft === 0) return <Alert tone="warning">This event is sold out.</Alert>;
  return (
    <button className="btn btn-primary btn-lg" type="button" onClick={onBook} disabled={busy}>
      {busy ? 'Reserving…' : user ? 'Reserve my seat' : 'Log in to reserve'}
    </button>
  );
}

export default function EventPage() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [myBooking, setMyBooking] = useState(null);
  const [feedback, setFeedback] = useState({ items: [], summary: { averageRating: 0, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState({ busy: false, error: '' });

  useEffect(() => {
    setLoading(true);
    Promise.all([getEvent(eventId), getEventFeedback(eventId), user ? listBookings() : []])
      .then(([nextEvent, nextFeedback, bookings]) => {
        setEvent(nextEvent);
        setFeedback(nextFeedback);
        setMyBooking(
          bookings.find((b) => b.event?._id === eventId && b.status !== 'cancelled') || null,
        );
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [eventId, user]);

  async function handleBook() {
    if (!user) return navigate('/login', { state: { from: `/events/${eventId}` } });
    setBooking({ busy: true, error: '' });
    try {
      const created = await createBooking(eventId);
      if (created.status === 'pending') return navigate(`/bookings/${created._id}/pay`);
      setMyBooking(created);
      setEvent({ ...event, bookedSeats: event.bookedSeats + 1 });
      setBooking({ busy: false, error: '' });
    } catch (requestError) {
      setBooking({ busy: false, error: requestError.message });
    }
  }

  if (loading) return <PageState>Loading event…</PageState>;
  if (error) return <PageState>{error}</PageState>;

  const seatsLeft = Math.max(event.capacity - (event.bookedSeats || 0), 0);
  const isPast = new Date(event.date) < new Date();
  const gallery = galleryFor(event);
  const canReview = isPast && myBooking?.status === 'confirmed';
  const { averageRating, total } = feedback.summary;

  return (
    <main>
      <header className="event-hero">
        <img src={imageFor(event.category, event.image)} alt="" />
        <div className="event-hero-box">
          <h1 className="highlight-heading highlight-heading-lg">
            <span>{event.name}</span>
          </h1>
          <div className="hero-facts">
            <span>
              <Icon name="calendar" /> {formatDateTime(event.date)}
            </span>
            <span>
              <Icon name="pin" /> {event.location}
            </span>
          </div>
        </div>
      </header>

      <section className="section-overview">
        <div className="overview-box">
          <div className="overview-group">
            <h2 className="heading-gradient heading-sm">Quick facts</h2>
            <Fact icon="calendar" label="When">
              {formatDateTime(event.date)}
            </Fact>
            <Fact icon="pin" label="Where">
              {event.location}
            </Fact>
            <Fact icon="tag" label="Category">
              {event.category}
            </Fact>
            <Fact icon="users" label="Seats">
              {seatsLeft} of {event.capacity} left
            </Fact>
            <Fact icon="ticket" label="Price">
              {formatPrice(event.price)}
            </Fact>
            <Fact icon="star" label="Rating">
              {total ? `${averageRating.toFixed(1)} / 5 (${total})` : 'No reviews yet'}
            </Fact>
          </div>
          <div className="overview-group">
            <h2 className="heading-gradient heading-sm">Organizer</h2>
            <div className="fact">
              <Avatar user={event.organizer || { name: 'EventFlow' }} />
              <span className="fact-label">Host</span>
              <span>{event.organizer?.name || 'EventFlow'}</span>
            </div>
          </div>
        </div>
        <div className="description-box">
          <h2 className="heading-gradient heading-sm">About {event.name}</h2>
          <p className="event-description">{event.description}</p>
          {!isPast && (
            <a className="btn btn-primary mt-3" href="#book">
              Reserve a seat <Icon name="arrow" size={16} />
            </a>
          )}
        </div>
      </section>

      <section className="section-pictures">
        {gallery.map((src) => (
          <div className="picture-box" key={src}>
            <img src={src} alt="" loading="lazy" />
          </div>
        ))}
      </section>

      {(feedback.items.length > 0 || canReview) && (
        <section className="section-reviews">
          <div className="container">
            <EventFeedback
              eventId={eventId}
              feedback={feedback}
              onChange={setFeedback}
              canReview={canReview}
            />
          </div>
        </section>
      )}

      <section className="container section" id="book">
        <div className="cta">
          <div className="cta-images">
            <span className="cta-img cta-img-logo">
              <Icon name="ticket" size={28} />
            </span>
            <img className="cta-img cta-img-1" src={gallery[1]} alt="" />
            <img className="cta-img cta-img-2" src={gallery[2]} alt="" />
          </div>
          <div className="cta-content">
            <h2 className="heading-gradient">One evening. One seat. Make it yours.</h2>
            <p className="muted">
              {seatsLeft > 0 && !isPast
                ? `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left for ${formatPrice(event.price).toLowerCase()}${event.price > 0 ? ' per person' : ''}.`
                : 'Bookings for this event are closed.'}
            </p>
            <div className="cta-actions">
              <BookingAction
                event={event}
                myBooking={myBooking}
                seatsLeft={seatsLeft}
                isPast={isPast}
                user={user}
                busy={booking.busy}
                onBook={handleBook}
              />
              <Alert>{booking.error}</Alert>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

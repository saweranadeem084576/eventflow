import { Link } from 'react-router-dom';
import { imageFor } from '../constants/eventImages';
import { formatDate, formatPrice } from '../utils/formatters';
import Icon from './Icon';

export default function EventCard({ event }) {
  const seatsLeft = Math.max(event.capacity - (event.bookedSeats || 0), 0);
  const isPast = new Date(event.date) < new Date();
  return (
    <article className="card event-card">
      <div className="event-card-picture">
        <img src={imageFor(event.category, event.image)} alt="" loading="lazy" />
        <h3 className="highlight-heading">
          <span>{event.name}</span>
        </h3>
      </div>
      <div className="event-card-details">
        <p className="event-card-sub">
          {event.category} · {event.location}
        </p>
        <p className="muted small event-card-text">{event.description}</p>
        <div className="event-card-data">
          <span>
            <Icon name="calendar" size={16} /> {formatDate(event.date)}
          </span>
          <span>
            {isPast ? (
              <>
                <Icon name="star" size={16} /> Event ended
              </>
            ) : (
              <>
                <Icon name="users" size={16} /> {seatsLeft} seats left
              </>
            )}
          </span>
        </div>
      </div>
      <div className="event-card-footer">
        <span>
          <strong>{formatPrice(event.price)}</strong>
          {event.price > 0 && <span className="muted small"> per seat</span>}
        </span>
        <Link className="btn btn-sm btn-primary" to={`/events/${event._id}`}>
          {isPast ? 'Read reviews' : 'Details'}
        </Link>
      </div>
    </article>
  );
}

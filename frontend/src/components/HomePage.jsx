import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listEvents, listRecentFeedback } from '../api';
import { imageFor } from '../constants/eventImages';
import { useAuth } from '../context/AuthContext';
import EventCard from './EventCard';
import HeroSlider from './HeroSlider';
import Icon from './Icon';
import { Avatar, EmptyState, PageState } from './ui';

const categories = ['Technology', 'Music', 'Art', 'Design', 'Food', 'Community', 'Wellness'];

const features = [
  {
    icon: 'search',
    title: 'Discover',
    text: 'Browse curated events by topic, category, and date — all in one place.',
  },
  {
    icon: 'zap',
    title: 'Book in seconds',
    text: 'Reserve your seat instantly. Free events confirm on the spot.',
  },
  {
    icon: 'shield',
    title: 'Pay securely',
    text: 'Card payments are handled by Stripe and refunded on cancellation.',
  },
  {
    icon: 'bell',
    title: 'Stay informed',
    text: 'Get notified when a booking is confirmed or an event changes.',
  },
];

const Stars = ({ rating }) => (
  <span className="stars" aria-label={`${rating} out of 5`}>
    {'★'.repeat(rating)}
    <span>{'★'.repeat(5 - rating)}</span>
  </span>
);

export default function HomePage() {
  const { user } = useAuth();
  const canOrganize = user && ['organizer', 'admin'].includes(user.role);
  const [events, setEvents] = useState(null);
  const [stories, setStories] = useState([]);

  useEffect(() => {
    listEvents({ from: new Date().toISOString(), limit: 6 })
      .then((payload) => setEvents(payload.data.events))
      .catch(() => setEvents([]));
    listRecentFeedback()
      .then(setStories)
      .catch(() => setStories([]));
  }, []);

  return (
    <main>
      <HeroSlider>
        <h1>Events worth showing up for.</h1>
        <p className="lead">
          Discover talks, workshops, concerts, and community gatherings near you — and reserve your
          seat in a few clicks.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-white" to="/events">
            Explore events
          </Link>
          {!user && (
            <Link className="btn btn-outline-white" to="/signup">
              Create an account
            </Link>
          )}
        </div>
      </HeroSlider>

      <section className="container section">
        <div className="section-title">
          <h2 className="heading-gradient">Upcoming events</h2>
          <p className="muted">Browse by category, or see everything on the calendar.</p>
        </div>
        <div className="chips">
          <Link className="chip is-active" to="/events">
            All
          </Link>
          {categories.map((category) => (
            <Link className="chip" key={category} to={`/events?category=${category}`}>
              <Icon name="tag" size={14} /> {category}
            </Link>
          ))}
        </div>
        {!events ? (
          <PageState>Loading events…</PageState>
        ) : events.length ? (
          <div className="event-grid">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Icon name="calendar" size={32} />}
            title="Nothing on the calendar yet"
            action={
              <Link className="btn btn-primary" to={canOrganize ? '/organizer/new' : '/signup'}>
                {canOrganize ? 'Create the first event' : 'Become an organizer'}
              </Link>
            }
          >
            New events are added by organizers and published after a quick review. Check back soon —
            or host one yourself.
          </EmptyState>
        )}
        {events?.length > 0 && (
          <div className="center mt-3">
            <Link className="btn btn-primary" to="/events">
              View all events <Icon name="arrow" size={16} />
            </Link>
          </div>
        )}
      </section>

      <section className="band">
        <div className="container">
          <div className="section-title">
            <h2 className="heading-gradient heading-white">Why EventFlow</h2>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <div className="feature" key={feature.title}>
                <span className="feature-icon">
                  <Icon name={feature.icon} size={36} />
                </span>
                <h3>{feature.title}</h3>
                <p className="muted small">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {stories.length > 0 && (
        <section className="container section">
          <div className="section-title">
            <h2 className="heading-gradient">Stories from attendees</h2>
          </div>
          <div className="story-grid">
            {stories.map((story) => (
              <article className="story" key={story._id}>
                {story.user?.avatar ? (
                  <Avatar user={story.user} size={96} className="story-img" />
                ) : (
                  <img
                    src={imageFor(story.event?.category, story.event?.image)}
                    alt=""
                    className="story-img"
                  />
                )}
                <div>
                  <Stars rating={story.rating} />
                  <p className="story-text">“{story.comment}”</p>
                  <p className="muted small">
                    <strong>{story.user?.name || 'Attendee'}</strong>
                    {story.event && (
                      <>
                        {' '}
                        · <Link to={`/events/${story.event._id}`}>{story.event.name}</Link>
                      </>
                    )}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="container section">
        <div className="cta">
          <div className="cta-images">
            <span className="cta-img cta-img-logo">
              <Icon name="ticket" size={28} />
            </span>
            <img className="cta-img cta-img-1" src={imageFor('music')} alt="" />
            <img className="cta-img cta-img-2" src={imageFor('food')} alt="" />
          </div>
          <div className="cta-content">
            <h2 className="heading-gradient">Hosting something?</h2>
            <p className="muted">
              Publish your event, manage registrations, and keep attendees informed — EventFlow
              handles the logistics so you can focus on the room.
            </p>
            {!user ? (
              <Link className="btn btn-primary" to="/signup">
                Become an organizer
              </Link>
            ) : user.role === 'user' ? (
              <Link className="btn btn-primary" to="/account/support">
                Request organizer access
              </Link>
            ) : (
              <Link className="btn btn-primary" to="/organizer/new">
                Create an event
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

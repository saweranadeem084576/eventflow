import { Link } from 'react-router-dom';
import { imageFor } from '../constants/eventImages';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';
import { Avatar } from './ui';

const steps = [
  {
    icon: 'search',
    title: 'Discover',
    text: 'Browse published events by category, keyword, or date. Every listing shows the venue, time, price, and seats left.',
  },
  {
    icon: 'ticket',
    title: 'Reserve',
    text: 'One click holds your seat. Free events confirm instantly; paid events are confirmed the moment Stripe accepts your card.',
  },
  {
    icon: 'bell',
    title: 'Show up',
    text: 'Confirmations and event changes land in your notifications. After the event, leave a rating to help the next attendee.',
  },
];

const roles = [
  {
    title: 'Attendees',
    text: 'Book and cancel seats, track booking history, receive notifications, and review events they attended.',
  },
  {
    title: 'Organizers',
    text: 'Create and edit events, upload cover and gallery images, view registrations, and get admin approval before going live.',
  },
  {
    title: 'Admins',
    text: 'Approve events, manage users and roles, monitor bookings, and resolve attendee complaints from one panel.',
  },
];

const faqs = [
  {
    q: 'Is it free to attend events?',
    a: 'Many events are free — just reserve a seat and it is confirmed instantly. Paid events show the price up front and are confirmed once your card payment goes through.',
  },
  {
    q: 'Can I cancel a booking?',
    a: 'Yes. Cancel any time from My space → Bookings. Your seat is released immediately and paid bookings are refunded to the original card.',
  },
  {
    q: 'How do I publish my own event?',
    a: 'Sign up as an organizer, fill in the event form in the Organizer studio, and submit it. An admin reviews it before it appears on the calendar, and you can edit it or view registrations at any time.',
  },
  {
    q: 'Will I be told if something changes?',
    a: 'Booking confirmations, cancellations, and any change an organizer makes to an event you booked land in your notifications.',
  },
];

const team = [
  { name: 'Zainab Fatima', role: 'Frontend development & UI' },
  { name: 'Sawera Nadeem', role: 'Backend development & database' },
];

export default function AboutPage() {
  const { user } = useAuth();
  return (
    <main>
      <section className="page-banner">
        <div className="container">
          <h1>About EventFlow</h1>
          <p>
            A smart event management system that replaces paper forms, group chats, and spreadsheets
            with one place to publish events, take bookings, and keep everyone informed.
          </p>
        </div>
      </section>

      <section className="container section about-intro">
        <div>
          <h2 className="heading-gradient">Why we built it</h2>
          <p className="about-copy">
            Managing events by hand is slow and error-prone: details get lost in messages,
            registrations live in spreadsheets, and nobody is sure how many seats are left.
            EventFlow was created to give colleges, communities, and small organizations a simple,
            reliable way to run events online — from the first announcement to the last review.
          </p>
        </div>
        <img className="about-img" src={imageFor('community')} alt="" />
      </section>

      <section className="band">
        <div className="container">
          <div className="section-title">
            <h2 className="heading-gradient heading-white">How it works</h2>
          </div>
          <div className="feature-grid feature-grid-3">
            {steps.map((step, index) => (
              <div className="feature" key={step.title}>
                <span className="feature-icon">
                  <Icon name={step.icon} size={36} />
                </span>
                <h3>
                  {index + 1}. {step.title}
                </h3>
                <p className="muted small">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-title">
          <h2 className="heading-gradient">Built for every role</h2>
        </div>
        <div className="grid-3">
          {roles.map((role) => (
            <div className="card card-body" key={role.title}>
              <h3>{role.title}</h3>
              <p className="muted small mt-1">{role.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-title">
          <h2 className="heading-gradient">Common questions</h2>
        </div>
        <div className="card faq">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p className="muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-title">
          <h2 className="heading-gradient">The team</h2>
          <p className="muted">
            A final year project of the Department of Information Technology & Computer Science,
            Govt. M.A.O Graduate College, Lahore (University of the Punjab).
          </p>
        </div>
        <div className="grid-2 team-grid">
          {team.map((member) => (
            <div className="card card-body team-card" key={member.name}>
              <Avatar user={member} size={64} />
              <h3>{member.name}</h3>
              <p className="muted small">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="cta">
          <div className="cta-images">
            <span className="cta-img cta-img-logo">
              <Icon name="ticket" size={28} />
            </span>
            <img className="cta-img cta-img-1" src={imageFor('technology')} alt="" />
            <img className="cta-img cta-img-2" src={imageFor('art')} alt="" />
          </div>
          <div className="cta-content">
            <h2 className="heading-gradient">Ready to get started?</h2>
            <p className="muted">
              Browse what is coming up, or create an account to reserve your first seat.
            </p>
            <div className="row">
              <Link className="btn btn-primary" to="/events">
                Explore events
              </Link>
              {!user && (
                <Link className="btn" to="/signup">
                  Sign up
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

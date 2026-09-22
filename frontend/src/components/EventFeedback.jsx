import { useState } from 'react';
import { getEventFeedback, submitFeedback } from '../api';
import { Alert, Avatar, Field } from './ui';

const Stars = ({ rating }) => (
  <span className="stars" aria-label={`${rating} out of 5`}>
    {'★'.repeat(rating)}
    <span>{'★'.repeat(5 - rating)}</span>
  </span>
);

export default function EventFeedback({ eventId, feedback, onChange, canReview }) {
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      await submitFeedback({ event: eventId, ...form });
      setMessage('Thanks — your review has been saved.');
      onChange(await getEventFeedback(eventId));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <>
      <div className="section-title">
        <h2 className="heading-gradient heading-white">Reviews</h2>
        <p className="reviews-summary">
          {feedback.summary.total
            ? `${feedback.summary.averageRating.toFixed(1)} / 5 from ${feedback.summary.total} attendee${feedback.summary.total === 1 ? '' : 's'}`
            : 'No reviews yet — attendees can review after the event.'}
        </p>
      </div>

      {feedback.items.length > 0 && (
        <div className="reviews">
          {feedback.items.map((item) => (
            <article className="review-card" key={item._id}>
              <div className="review-user">
                <Avatar user={item.user} />
                <strong>{item.user?.name || 'Attendee'}</strong>
              </div>
              <p className="review-text">{item.comment || 'No comment left.'}</p>
              <Stars rating={item.rating} />
            </article>
          ))}
        </div>
      )}

      {canReview && !message && (
        <form className="card card-body stack review-form" onSubmit={handleSubmit}>
          <h3>Share your experience</h3>
          <Field label="Rating">
            <select
              className="input"
              value={form.rating}
              onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })}
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </select>
          </Field>
          <Field label="Comment (optional)">
            <textarea
              className="input"
              maxLength="1000"
              value={form.comment}
              onChange={(event) => setForm({ ...form, comment: event.target.value })}
            />
          </Field>
          <div>
            <button className="btn btn-primary" type="submit">
              Submit review
            </button>
          </div>
        </form>
      )}
      <div className="review-form">
        <Alert tone="success">{message}</Alert>
        <Alert>{error}</Alert>
      </div>
    </>
  );
}

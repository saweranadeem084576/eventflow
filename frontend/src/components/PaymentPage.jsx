import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { confirmPayment, createPaymentIntent, getBooking } from '../api';
import { imageFor } from '../constants/eventImages';
import { formatDateTime, formatPrice } from '../utils/formatters';
import Icon from './Icon';
import { Alert, PageState } from './ui';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

// Matches the Payment Element to the app's own form styling.
const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#2563eb',
    colorText: '#111827',
    colorTextSecondary: '#6b7280',
    colorDanger: '#b91c1c',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSizeBase: '15px',
    borderRadius: '8px',
  },
  rules: {
    '.Input': { border: '1px solid #e5e7eb', boxShadow: 'none', padding: '10px 12px' },
    '.Input:focus': { border: '1px solid #2563eb', boxShadow: '0 0 0 3px #eff6ff' },
    '.Label': { fontWeight: '500', marginBottom: '6px' },
  },
};

function PaymentForm({ paymentId, amount, onComplete, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    onError('');
    const result = await stripe.confirmPayment({ elements, redirect: 'if_required' });
    if (result.error) {
      onError(result.error.message);
    } else {
      try {
        await confirmPayment(paymentId);
        onComplete();
        return;
      } catch (error) {
        onError(error.message);
      }
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button
        className="btn btn-primary btn-block btn-lg mt-3"
        type="submit"
        disabled={!stripe || submitting}
      >
        {submitting ? 'Processing…' : `Pay ${formatPrice(amount)}`}
      </button>
      <p className="checkout-note">
        <Icon name="shield" size={14} /> Payments are processed securely by Stripe. We never see
        your card details.
      </p>
    </form>
  );
}

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  // StrictMode runs effects twice in development; only start checkout once per booking.
  const started = useRef(null);

  useEffect(() => {
    if (started.current === bookingId) return;
    started.current = bookingId;

    getBooking(bookingId)
      .then(async (nextBooking) => {
        setBooking(nextBooking);
        if (nextBooking.status === 'pending' && stripePromise) {
          setPayment(await createPaymentIntent(bookingId));
        }
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) return <PageState>Preparing secure checkout…</PageState>;

  const event = booking?.event;
  const price = event?.price ?? 0;

  return (
    <main className="checkout">
      <div className="checkout-grid">
        <aside className="checkout-summary">
          <Link className="btn-link" to="/account">
            ← Back to my bookings
          </Link>
          {event && (
            <>
              <img className="checkout-img" src={imageFor(event.category, event.image)} alt="" />
              <h2 className="checkout-event">{event.name}</h2>
              <p className="muted small">
                {formatDateTime(event.date)}
                <br />
                {event.location}
              </p>
              <dl className="checkout-lines">
                <div>
                  <dt>General admission × 1</dt>
                  <dd>{formatPrice(price)}</dd>
                </div>
                <div className="checkout-total">
                  <dt>Total due</dt>
                  <dd>{formatPrice(price)}</dd>
                </div>
              </dl>
            </>
          )}
        </aside>

        <section className="checkout-panel">
          <div className="checkout-head">
            <h1>Checkout</h1>
            <span className="checkout-secure">
              <Icon name="shield" size={14} /> Secure
            </span>
          </div>

          <Alert>{error}</Alert>
          {booking?.status === 'confirmed' && (
            <>
              <Alert tone="success">This booking is already confirmed — no payment needed.</Alert>
              <Link className="btn btn-primary" to="/account">
                View my bookings
              </Link>
            </>
          )}
          {booking?.status === 'cancelled' && (
            <Alert tone="warning">This booking was cancelled, so it can no longer be paid.</Alert>
          )}
          {booking?.status === 'pending' && !stripePromise && (
            <Alert tone="warning">
              Payments are not configured. Set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> to enable
              checkout.
            </Alert>
          )}
          {payment && (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret: payment.clientSecret, appearance }}
            >
              <PaymentForm
                paymentId={payment.paymentId}
                amount={price}
                onComplete={() =>
                  navigate('/account', {
                    state: {
                      message: `Payment complete — your seat for ${event.name} is confirmed.`,
                    },
                  })
                }
                onError={setError}
              />
            </Elements>
          )}
        </section>
      </div>
    </main>
  );
}

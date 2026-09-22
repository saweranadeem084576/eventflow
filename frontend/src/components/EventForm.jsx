import { useState } from 'react';
import { toDateTimeInput } from '../utils/formatters';
import { Alert, Field } from './ui';

const emptyEvent = {
  name: '',
  category: '',
  description: '',
  date: '',
  location: '',
  image: '',
  gallery: '',
  price: 0,
  capacity: 20,
};

const toForm = (event) =>
  event
    ? {
        ...emptyEvent,
        ...event,
        image: event.image || '',
        gallery: (event.images || []).join('\n'),
        date: toDateTimeInput(event.date),
      }
    : emptyEvent;

export default function EventForm({ event, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toForm(event));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const bind = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { name, category, description, location, image } = form;
      await onSubmit({
        name,
        category,
        description,
        location,
        date: new Date(form.date).toISOString(),
        price: Number(form.price),
        capacity: Number(form.capacity),
        ...(image.trim() && { image: image.trim() }),
        images: form.gallery
          .split('\n')
          .map((url) => url.trim())
          .filter(Boolean)
          .slice(0, 3),
      });
      if (!event) setForm(emptyEvent);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card card-body stack" onSubmit={handleSubmit}>
      <div className="form-row">
        <Field label="Event name">
          <input className="input" {...bind('name')} required />
        </Field>
        <Field label="Category">
          <input
            className="input"
            placeholder="e.g. Music, Technology"
            {...bind('category')}
            required
          />
        </Field>
      </div>
      <Field label="Description">
        <textarea className="input" {...bind('description')} required />
      </Field>
      <div className="form-row">
        <Field label="Date & time">
          <input className="input" type="datetime-local" {...bind('date')} required />
        </Field>
        <Field label="Location">
          <input className="input" {...bind('location')} required />
        </Field>
      </div>
      <div className="form-row">
        <Field label="Cover image URL (optional)">
          <input className="input" type="url" placeholder="https://…" {...bind('image')} />
        </Field>
        <Field label="Gallery image URLs (optional, up to 3, one per line)">
          <textarea className="input" rows="3" placeholder="https://…" {...bind('gallery')} />
        </Field>
      </div>
      <div className="form-row">
        <Field label="Price (USD, 0 for free)">
          <input className="input" type="number" min="0" step="1" {...bind('price')} required />
        </Field>
        <Field label="Capacity">
          <input className="input" type="number" min="1" step="1" {...bind('capacity')} required />
        </Field>
      </div>
      <Alert>{error}</Alert>
      <div className="row">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : event ? 'Save changes' : 'Create event'}
        </button>
        {onCancel && (
          <button className="btn" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

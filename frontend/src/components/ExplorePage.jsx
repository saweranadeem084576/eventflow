import { useSearchParams } from 'react-router-dom';
import EventCard from './EventCard';
import Icon from './Icon';
import { Alert, EmptyState, PageState } from './ui';
import { useEvents } from '../hooks/useEvents';

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = Object.fromEntries(searchParams);
  const { events, loading, error, filters, pagination, goToPage } = useEvents(initialFilters);
  const { page, pages, total } = pagination;

  const showingPast = initialFilters.when === 'past';

  function handleSearch(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const next = Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim()));
    setSearchParams(showingPast ? { ...next, when: 'past' } : next);
  }

  function setWhen(when) {
    const next = { ...initialFilters };
    if (when === 'past') next.when = 'past';
    else delete next.when;
    setSearchParams(next);
  }

  return (
    <main className="container page">
      <div className="section-title">
        <h1 className="heading-gradient">All events</h1>
        <p className="muted">
          {showingPast
            ? 'Finished events, newest first — open one to read attendee reviews.'
            : 'Search upcoming events by name, topic, or category.'}
        </p>
      </div>

      <div className="chips" role="tablist" aria-label="Time range">
        <button
          type="button"
          role="tab"
          aria-selected={!showingPast}
          className={`chip ${showingPast ? '' : 'is-active'}`}
          onClick={() => setWhen('upcoming')}
        >
          <Icon name="calendar" size={14} /> Upcoming
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={showingPast}
          className={`chip ${showingPast ? 'is-active' : ''}`}
          onClick={() => setWhen('past')}
        >
          <Icon name="star" size={14} /> Past &amp; reviewed
        </button>
      </div>

      <form className="search" onSubmit={handleSearch} key={searchParams.toString()}>
        <div className="input-icon">
          <Icon name="search" size={18} />
          <input
            className="input"
            name="search"
            defaultValue={filters.search || ''}
            placeholder="Search by name or topic"
            aria-label="Search events"
          />
        </div>
        <div className="input-icon">
          <Icon name="tag" size={18} />
          <input
            className="input"
            name="category"
            defaultValue={filters.category || ''}
            placeholder="Category"
            aria-label="Filter by category"
          />
        </div>
        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </form>

      <p className="muted small mt-3">
        {total} {showingPast ? 'past' : 'upcoming'} event{total === 1 ? '' : 's'}
      </p>
      <Alert>{error}</Alert>
      {loading ? (
        <PageState>Loading events…</PageState>
      ) : events.length ? (
        <div className="event-grid mt-2">
          {events.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Icon name="search" size={32} />}
          title="No events match"
          action={
            Object.keys(filters).length > 0 && (
              <button className="btn" type="button" onClick={() => setSearchParams({})}>
                Clear filters
              </button>
            )
          }
        >
          Try a different keyword or category, or check back soon for new listings.
        </EmptyState>
      )}

      {pages > 1 && (
        <nav className="pagination" aria-label="Pagination">
          <button
            className="btn btn-sm"
            type="button"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </button>
          <span className="muted small">
            Page {page} of {pages}
          </span>
          <button
            className="btn btn-sm"
            type="button"
            disabled={page >= pages}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}

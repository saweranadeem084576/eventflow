import { useEffect, useState } from 'react';
import { heroImages } from '../constants/eventImages';

const INTERVAL_MS = 5000;

export default function HeroSlider({ children }) {
  const [active, setActive] = useState(0);

  // Re-armed after every change, so a manual dot click also gets a full interval.
  useEffect(() => {
    const timer = window.setTimeout(
      () => setActive((i) => (i + 1) % heroImages.length),
      INTERVAL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [active]);

  return (
    <section className="hero">
      {heroImages.map((src, index) => (
        <div
          className={`hero-slide ${index === active ? 'is-active' : ''}`}
          style={{ backgroundImage: `url(${src})` }}
          key={src}
          aria-hidden="true"
        />
      ))}
      <div className="hero-content">{children}</div>
      <div className="hero-dots" role="tablist" aria-label="Hero images">
        {heroImages.map((src, index) => (
          <button
            key={src}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-label={`Show image ${index + 1}`}
            className={index === active ? 'is-active' : ''}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </section>
  );
}

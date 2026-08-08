import { useEffect, useState } from 'react';

const SCENES = ['Coastal roads', 'Open countryside', 'City lights'];

export default function TravelLoader({ onComplete }: { onComplete?: () => void }) {
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setScene((current) => (current + 1) % SCENES.length), 1500);
    const timeout = onComplete ? window.setTimeout(onComplete, 4500) : undefined;
    return () => {
      window.clearInterval(interval);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <div className="travel-loader" role="status" aria-live="polite" aria-label="Preparing your ride">
      <div className={`travel-sky travel-sky-${scene}`}>
        <span className="travel-sun" />
        <span className="travel-cloud travel-cloud-one" />
        <span className="travel-cloud travel-cloud-two" />
        <div className="travel-mountains" />
        <div className="travel-road" />
        <div className="travel-road-line" />
        <div className="travel-car" aria-hidden="true">
          <span className="travel-car-window" />
          <span className="travel-car-body" />
          <span className="travel-wheel travel-wheel-left" />
          <span className="travel-wheel travel-wheel-right" />
        </div>
      </div>
      <div className="travel-loader-copy">
        <span className="travel-kicker">DriverConnect</span>
        <strong>{SCENES[scene]}</strong>
        <span>Finding the best way forward</span>
        <div className="travel-progress" aria-hidden="true"><span /></div>
      </div>
    </div>
  );
}

export { SCENES };

/* Keep the loader self-contained so it can be reused during route transitions. */

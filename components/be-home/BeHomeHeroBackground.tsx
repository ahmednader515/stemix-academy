/** Modern hero backdrop — soft gradient mesh with dot grid */
export function BeHomeHeroBackground() {
  return (
    <div className="be-hero-bg" aria-hidden>
      <div className="be-hero-bg__mesh" />
      <div className="be-hero-bg__grid" />
      <div className="be-hero-bg__orb be-hero-bg__orb--1" />
      <div className="be-hero-bg__orb be-hero-bg__orb--2" />
      <div className="be-hero-bg__orb be-hero-bg__orb--3" />
    </div>
  );
}

import './StageFloor.css';

export function StageFloor() {
  return (
    <div className="stage-floor" aria-hidden="true">
      <div className="stage-floor__platform" />
      <div className="stage-floor__reflection" />
      <div className="stage-floor__glow-line" />
    </div>
  );
}

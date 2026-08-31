import './CornerTags.css';

export function CornerTags({ dimmed = false }: { dimmed?: boolean }) {
  return (
    <>
      <div className={`corner-tag corner-tag--left ${dimmed ? 'corner-tag--dimmed' : ''}`}>
        GOOD LUCK, MATADORS!
      </div>
      <div className={`corner-tag corner-tag--right ${dimmed ? 'corner-tag--dimmed' : ''}`}>
        CAREERS START HERE. FUTURES ARE BUILT HERE.
      </div>
    </>
  );
}

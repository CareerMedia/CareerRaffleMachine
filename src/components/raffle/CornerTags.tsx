import './CornerTags.css';

const FALLBACK_TAGLINE = 'CAREERS START HERE. FUTURES ARE BUILT HERE.';

interface CornerTagsProps {
  dimmed?: boolean;
  raffleTitle?: string;
}

export function CornerTags({ dimmed = false, raffleTitle }: CornerTagsProps) {
  const trimmedTitle = raffleTitle?.trim();

  return (
    <>
      <div className={`corner-tag corner-tag--left ${dimmed ? 'corner-tag--dimmed' : ''}`}>
        GOOD LUCK, MATADORS!
      </div>
      <div
        className={`corner-tag corner-tag--right ${
          trimmedTitle ? 'corner-tag--title' : ''
        } ${dimmed ? 'corner-tag--dimmed' : ''}`}
      >
        {trimmedTitle || FALLBACK_TAGLINE}
      </div>
    </>
  );
}

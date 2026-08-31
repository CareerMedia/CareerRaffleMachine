import './WheelHub.css';

interface WheelHubProps {
  onClick?: () => void;
  disabled?: boolean;
  isPreparing?: boolean;
  hidden?: boolean;
}

export function WheelHub({
  onClick,
  disabled = false,
  isPreparing = false,
  hidden = false,
}: WheelHubProps) {
  return (
    <div
      className={`wheel-hub-anchor ${hidden ? 'wheel-hub-anchor--hidden' : ''}`}
    >
      <button
        type="button"
        className={`wheel-hub ${isPreparing ? 'wheel-hub--preparing' : ''}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Start spin"
      >
        <span className="wheel-hub__pulse" aria-hidden="true" />
        <span className="wheel-hub__outer-ring" aria-hidden="true" />
        <span className="wheel-hub__inner-glow" aria-hidden="true" />
        <span className="wheel-hub__disc">
          <span className="wheel-hub__chevron" aria-hidden="true">▼</span>
          <span className="wheel-hub__label-top">TAP TO</span>
          <span className="wheel-hub__label-main">START</span>
          <span className="wheel-hub__label-sub">SPIN</span>
        </span>
        {isPreparing && <span className="wheel-hub__ripple" aria-hidden="true" />}
      </button>
    </div>
  );
}

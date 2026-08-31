import './OrbitDecor.css';

const SPHERES = [
  { color: '#f5b52e', size: 28, top: '18%', left: '8%', delay: 0 },
  { color: '#e82c47', size: 20, top: '55%', left: '5%', delay: -4 },
  { color: '#793fe8', size: 24, top: '25%', right: '7%', delay: -8 },
  { color: '#526feb', size: 18, top: '60%', right: '6%', delay: -12 },
  { color: '#f5b52e', size: 14, top: '40%', right: '12%', delay: -6 },
] as const;

export function OrbitDecor() {
  return (
    <div className="orbit-decor" aria-hidden="true">
      <div className="orbit-decor__ribbon orbit-decor__ribbon--1" />
      <div className="orbit-decor__ribbon orbit-decor__ribbon--2" />
      {SPHERES.map((s, i) => (
        <div
          key={i}
          className="orbit-decor__sphere"
          style={{
            width: s.size,
            height: s.size,
            top: s.top,
            left: 'left' in s ? s.left : undefined,
            right: 'right' in s ? s.right : undefined,
            background: `radial-gradient(circle at 30% 25%, ${s.color}ee, ${s.color}88)`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

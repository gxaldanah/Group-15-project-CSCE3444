import { useEffect, useState } from 'react';
import { defaultAttributes, defaultPoints, type Attributes } from './gameProgress.ts';

type Props = {
  initialPoints?: number;
  initialStats?: Attributes;
  onBack: () => void;
  onChange: (pointsLeft: number, stats: Attributes) => void;
  onContinue: (pointsLeft: number, stats: Attributes) => void;
};

export default function PointAllocation({
  initialPoints = defaultPoints,
  initialStats = defaultAttributes,
  onBack,
  onChange,
  onContinue,
}: Props) {
  const [points, setPoints] = useState(initialPoints);
  const [stats, setStats] = useState<Attributes>(initialStats);

  useEffect(() => {
    setPoints(initialPoints);
  }, [initialPoints]);

  useEffect(() => {
    setStats(initialStats);
  }, [initialStats]);

  const updateStat = (attr: keyof Attributes, change: number) => {
    if (change > 0 && points <= 0) return;
    if (change < 0 && stats[attr] <= 0) return;

    const nextStats = { ...stats, [attr]: stats[attr] + change };
    const nextPoints = points - change;

    setStats(nextStats);
    setPoints(nextPoints);
    onChange(nextPoints, nextStats);
  };

  const reset = () => {
    setPoints(defaultPoints);
    setStats(defaultAttributes);
    onChange(defaultPoints, defaultAttributes);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', margin: '0 auto' }}>

      <p className="game-subtitle" style={{ textAlign: 'center', marginBottom: '16px' }}>
        Points Left: {points}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: 'min(480px, 100%)' }}>
        {Object.keys(stats).map((key) => {
          const attr = key as keyof Attributes;

          return (
            <div className="char-card" key={attr}>
              <h3>{attr.charAt(0).toUpperCase() + attr.slice(1)}</h3>
              <div style={{ marginTop: '10px' }}>
                <button onClick={() => updateStat(attr, -1)}>-</button>
                <span style={{ margin: '0 15px' }}>{stats[attr]}</span>
                <button onClick={() => updateStat(attr, 1)}>+</button>
              </div>
            </div>
          );
        })}

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button className="select-btn" style={{ flex: 1 }} onClick={reset}>
            Reset
          </button>
          <button className="select-btn" style={{ flex: 1 }} onClick={() => onContinue(points, stats)}>
            Continue
          </button>
        </div>

        <button className="back-link" onClick={onBack} style={{ marginTop: '8px' }}>
          Back to Character Select
        </button>
      </div>

    </div>
  );
}
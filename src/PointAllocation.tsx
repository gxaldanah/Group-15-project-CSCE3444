import { useState } from "react";

type Props = {
  onNext: () => void;
};

type Attributes = {
  strength: number;
  intelligence: number;
  charisma: number;
  agility: number;
  luck: number;
};

export default function PointAllocation({ onNext }: Props) {
  const [points, setPoints] = useState(20);
  const [stats, setStats] = useState<Attributes>({
    strength: 0,
    intelligence: 0,
    charisma: 0,
    agility: 0,
    luck: 0,
  });

  const updateStat = (attr: keyof Attributes, change: number) => {
    if (change > 0 && points <= 0) return;
    if (change < 0 && stats[attr] <= 0) return;
    setStats((prev) => ({ ...prev, [attr]: prev[attr] + change }));
    setPoints((prev) => prev - change);
  };

  const reset = () => {
    setPoints(20);
    setStats({ strength: 0, intelligence: 0, charisma: 0, agility: 0, luck: 0 });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", margin: "0 auto" }}>

      <p className="game-subtitle" style={{ textAlign: "center", marginBottom: "16px" }}>
        Points Left: {points}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "480px" }}>
        {Object.keys(stats).map((key) => {
          const attr = key as keyof Attributes;
          return (
            <div className="char-card" key={attr}>
              <h3>{attr.charAt(0).toUpperCase() + attr.slice(1)}</h3>
              <div style={{ marginTop: "10px" }}>
                <button onClick={() => updateStat(attr, -1)}>-</button>
                <span style={{ margin: "0 15px" }}>{stats[attr]}</span>
                <button onClick={() => updateStat(attr, 1)}>+</button>
              </div>
            </div>
          );
        })}

        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          <button className="select-btn" style={{ flex: 1 }} onClick={reset}>
            Reset
          </button>
          <button className="select-btn" style={{ flex: 1 }} onClick={onNext}>
            Continue
          </button>
        </div>
      </div>

    </div>
  );
}
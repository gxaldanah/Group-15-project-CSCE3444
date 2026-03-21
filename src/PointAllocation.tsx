mport { useState } from "react";

type Attributes = {
  strength: number;
  intelligence: number;
  charisma: number;
  agility: number;
  luck: number;
};

export default function PointAllocation() {
  const [points, setPoints] = useState(20);

  const [stats, setStats] = useState<Attributes>({
    strength: 0,
    intelligence: 0,
    charisma: 0,
    agility: 0,
    luck: 0,
  });

  const updateStat = (attr: keyof Attributes, change: number) => {
    // prevent overspending
    if (change > 0 && points <= 0) return;

    // prevent going below 0
    if (change < 0 && stats[attr] <= 0) return;

    setStats((prev) => ({
      ...prev,
      [attr]: prev[attr] + change,
    }));

    setPoints((prev) => prev - change);
  };

  const reset = () => {
    setPoints(20);
    setStats({
      strength: 0,
      intelligence: 0,
      charisma: 0,
      agility: 0,
      luck: 0,
    });
  };

  return (
    <div>
      <p>Points Left: {points}</p>

      {Object.keys(stats).map((key) => {
        const attr = key as keyof Attributes;

        return (
          <div key={attr}>
            {attr.charAt(0).toUpperCase() + attr.slice(1)}
            <button onClick={() => updateStat(attr, -1)}>-</button>
            <span>{stats[attr]}</span>
            <button onClick={() => updateStat(attr, 1)}>+</button>
          </div>
        );
      })}

      <button onClick={reset}>Reset</button>
    </div>
  );
}
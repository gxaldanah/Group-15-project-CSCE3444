type CharacterSelectProp = {
  // back to main menu
  onBack: () => void;
  // continue with selecting character
  onChoose: (name: string) => void;
};

const characters = [
  {
    name: "The Warrior",
    description: "A brave fighter who leads with strength and courage on the battlefield.",
  },
  {
    name: "The Diplomat",
    description: "A wise negotiator who builds bridges between people through trust and understanding.",
  },
  {
    name: "The Guardian",
    description: "A balanced protector with steady abilities.",
  },
  {
    name: "The Mystic",
    description: "A seeker of ancient wisdom and hidden power.",
  },
  {
    name: "The Rogue",
    description: "A quick and clever adventurer who relies on agility.",
  },
  {
    name: "The Scholar",
    description: "A brilliant researcher with sharp insight.",
  },
];

// main component making up the character select screen (JSX format)
export default function CharacterSelect({
  onBack,
  onChoose,
}: CharacterSelectProp) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #111827 0%, #4c1d95 100%)",
        color: "white",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* title */}
        <h1 style={{ textAlign: "center", marginBottom: "8px" }}>
          Choose Your Character
        </h1>

        {/* subtitle */}
        <p style={{ textAlign: "center", color: "#d1d5db", marginBottom: "24px" }}>
          Each character has unique strengths that will shape your journey.
        </p>

        {/* character cards grids */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {/* loop through characters array */}
          {characters.map((character) => (
            <div
              key={character.name}
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                border: "1px solid #7c3aed",
                borderRadius: "16px",
                padding: "20px",
              }}
            >
              {/* character name */}
              <h2 style={{ marginTop: 0 }}>{character.name}</h2>

              {/* character description */}
              <p style={{ color: "#d1d5db", lineHeight: "1.5" }}>
                {character.description}
              </p>

              {/* choose character button */}
              <button
                onClick={() => onChoose(character.name)}
                style={{
                  marginTop: "12px",
                  width: "100%",
                  padding: "12px",
                  border: "none",
                  borderRadius: "10px",
                  background: "linear-gradient(90deg, #9333ea, #ec4899)",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Choose {character.name}
              </button>
            </div>
          ))}
        </div>

        {/* back button */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button
            onClick={onBack}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: "1px solid #c084fc",
              background: "transparent",
              color: "white",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

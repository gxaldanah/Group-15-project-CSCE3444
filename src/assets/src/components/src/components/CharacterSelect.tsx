export default function CharacterSelect({ onSelect }: any) {
  return (
    <div style={{ textAlign: "center" }}>
      <h2>Select Your Character</h2>

      <button onClick={() => onSelect("warrior")}>
        The Warrior
      </button>

      <button onClick={() => onSelect("mage")}>
        The Diplomat
      </button>

    <button onClick={() => onSelect("guardian")}>
      The Guardian
    </button>   

    <button onClick={() => onSelect("mystic")}>
      The Mystic
    </button>       

<button onClick={() => onSelect("rogue")}>
      The Rogue
    </button>

<button onClick={() => onSelect("scholar")}>
      The Scholar
    </button>

    </div>
  );
}
import {useState} from "react";
import CharacterSelect from "./composition/charSelect";
import PointAllocation from "./PointAllocation";

function App() {

  // track what screen is shown 
const [screen, setScreen] = useState<"menu" | "characters" | "allocation" | "summary">("menu");

// stores selected char. name
const [selectedCharacter, setSelectedCharacter] = useState("");

// main menu
 if (screen === "menu") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(180deg, #111827 0%, #6b21a8 100%)",
          color: "white",
          padding: "24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "700px",
            backgroundColor: "rgba(15, 23, 42, 0.88)",
            border: "1px solid #7c3aed",
            borderRadius: "20px",
            padding: "36px",
            textAlign: "center",
          }}
        >
          <h1 style={{color: "white"}}>Forge Your Destiny</h1>
          <p>Shape your story through your choices.</p>

          <div style={{ marginTop: "20px" }}>
            <button
              onClick={() => setScreen("characters")}
              style={{
                marginRight: "10px",
                padding: "12px 20px",
                border: "none",
                borderRadius: "10px",
                background: "linear-gradient(90deg, #9333ea, #ec4899)",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Start New Game
            </button>

            <button disabled>Load Saved Game</button>
          </div>
        </div>
      </div>
    );
  }

   if (screen === "characters") {
    return (
      <CharacterSelect
        onBack={() => setScreen("menu")}
        onChoose={(name: string) => {
          setSelectedCharacter(name);
          setScreen("allocation");
        }}
      />
    );
  }

if (screen === "allocation") {
    return (
      <PointAllocation />
    );
  }

  // summary
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(180deg, #111827 0%, #4c1d95 100%)",
        color: "white",
        padding: "24px",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          border: "1px solid #7c3aed",
          borderRadius: "20px",
          padding: "32px",
          width: "100%",
          maxWidth: "600px",
          textAlign: "center",
        }}
      >
        <h2>You chose {selectedCharacter}</h2>
        <p style={{ color: "#d1d5db" }}>
        point allocation / story intro in progress
        </p>

        <button
          onClick={() => setScreen("characters")}
          style={{
            marginTop: "18px",
            padding: "12px 20px",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(90deg, #9333ea, #ec4899)",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Choose Again
        </button>
      </div>

      <div style={{ marginTop: "40px:"}}>
        <PointAllocation />
      </div>
    </div>
  );
}

export default App;

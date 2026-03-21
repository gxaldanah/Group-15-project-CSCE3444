function App() {
  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Forge Your Destiny</h1>
      <p>Shape your story through your choices.</p>

      <div style={{ marginTop: "20px" }}>
        <button style={{ marginRight: "10px" }}>
          Start New Game
        </button>

        <button disabled>
          Load Saved Game
        </button>
      </div>

      <div style={{ marginTop: "40px:"}}>
        <PointAllocation />
      </div>
    </div>
  );
}

export default App;

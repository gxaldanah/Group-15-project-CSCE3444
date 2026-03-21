import { Player, Attributes } from "./player";

const player = new Player(20);

const statsContainer = document.getElementById("stats")!;
const pointsDisplay = document.getElementById("points")!;
const resetBtn = document.getElementById("resetBtn")!;

const attributes: (keyof Attributes)[] = [
  "strength",
  "intelligence",
  "charisma",
  "agility",
  "luck",
];

// Create stat rows
attributes.forEach((attr) => {
  const row = document.createElement("div");

  row.innerHTML = `
    ${attr}
    <button>-</button>
    <span id="${attr}">0</span>
    <button>+</button>
  `;

  const [minusBtn, , plusBtn] = row.querySelectorAll("button");

  minusBtn.addEventListener("click", () => {
    if (player.deallocate(attr)) updateUI();
  });

  plusBtn.addEventListener("click", () => {
    if (player.allocate(attr)) updateUI();
  });

  statsContainer.appendChild(row);
});

resetBtn.addEventListener("click", () => {
  player.reset(20);
  updateUI();
});

function updateUI() {
  pointsDisplay.textContent = player.totalPoints.toString();

  attributes.forEach((attr) => {
    document.getElementById(attr)!.textContent =
      player.attributes[attr].toString();
  });
}

updateUI();

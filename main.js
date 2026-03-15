// --- Data models ---

class Tribute {
  constructor(id, name, district) {
    this.id = id;
    this.name = name;
    this.district = district;
    this.alive = true;
  }
}

const phases = ["Bloodbath", "Day", "Night"];

let state = {
  day: 1,
  phaseIndex: 0,
  tributes: [],
  log: []
};

// Simple example events
const events = [
  {
    id: 1,
    minParticipants: 1,
    maxParticipants: 1,
    fatalities: 0,
    descriptionTemplate: "{0} finds a backpack full of supplies."
  },
  {
    id: 2,
    minParticipants: 2,
    maxParticipants: 2,
    fatalities: 1,
    descriptionTemplate: "{0} kills {1} with a spear."
  },
  {
    id: 3,
    minParticipants: 3,
    maxParticipants: 3,
    fatalities: 2,
    descriptionTemplate: "{0}, {1}, and {2} get into a fight. Only {0} survives."
  }
];

// --- Utility functions ---

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function renderTemplate(template, tributes) {
  return template.replace(/\{(\d+)\}/g, (_, idx) => tributes[idx].name);
}

// --- Simulation logic ---

function parseTributes(input) {
  const lines = input.split("\n").map(l => l.trim()).filter(Boolean);
  return lines.map((line, idx) => {
    const parts = line.split(",");
    const name = parts[0].trim();
    const district = parts[1] ? parts[1].trim() : "?";
    return new Tribute(idx, name, district);
  });
}

function getAliveTributes() {
  return state.tributes.filter(t => t.alive);
}

function pickEvent(availableCount) {
  const candidates = events.filter(
    e => e.minParticipants <= availableCount && e.maxParticipants >= e.minParticipants
  );
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function resolveEvent(event, pool) {
  const count = event.maxParticipants; // simple: always use max
  const participants = pool.splice(0, count);
  // Apply fatalities
  for (let i = 0; i < event.fatalities; i++) {
    if (participants[i]) {
      participants[i].alive = false;
    }
  }
  const text = renderTemplate(event.descriptionTemplate, participants);
  state.log.push(text);
}

function stepPhase() {
  const alive = getAliveTributes();
  if (alive.length <= 1) {
    if (alive.length === 1) {
      state.log.push(`${alive[0].name} wins the Hunger Games!`);
    } else {
      state.log.push("No one survives.");
    }
    updateUI();
    document.getElementById("nextBtn").disabled = true;
    return;
  }

  let pool = shuffle([...alive]);

  while (pool.length > 0) {
    const event = pickEvent(pool.length);
    if (!event) break;
    resolveEvent(event, pool);
  }

  // Advance phase/day
  state.phaseIndex = (state.phaseIndex + 1) % phases.length;
  if (state.phaseIndex === 0) state.day += 1;

  updateUI();
}

// --- UI ---

function updateUI() {
  const phaseTitle = document.getElementById("phaseTitle");
  phaseTitle.textContent = `${phases[state.phaseIndex]} (Day ${state.day})`;

  const logDiv = document.getElementById("log");
  logDiv.innerHTML = "";
  state.log.forEach(line => {
    const p = document.createElement("p");
    p.textContent = line;
    logDiv.appendChild(p);
  });

  const tributesDiv = document.getElementById("tributes");
  tributesDiv.innerHTML = "";
  state.tributes.forEach(t => {
    const span = document.createElement("span");
    span.textContent = `${t.name} (D${t.district})`;
    if (!t.alive) span.classList.add("dead");
    tributesDiv.appendChild(span);
  });
}

// --- Wiring ---

document.getElementById("startBtn").addEventListener("click", () => {
  const input = document.getElementById("tributeInput").value;
  state.tributes = parseTributes(input);
  state.log = ["The Hunger Games begin!"];
  state.day = 1;
  state.phaseIndex = 0;

  document.getElementById("setup").classList.add("hidden");
  document.getElementById("sim").classList.remove("hidden");
  document.getElementById("nextBtn").disabled = false;

  updateUI();
});

document.getElementById("nextBtn").addEventListener("click", () => {
  stepPhase();
});

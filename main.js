// --- Data models ---

class Tribute {
  constructor(id, name, district, imageUrl = null) {
    this.id = id;
    this.name = name;
    this.district = district;
    this.imageUrl = imageUrl;
    this.alive = true;
  }
}

const phaseNames = ["Bloodbath", "Day", "Night"];

let state = {
  day: 1,
  phaseIndex: 0,
  tributes: [],
  phases: [] // each: { title, events: [string] }
};

let events = [];

// --- Load events from JSON ---

async function loadEvents() {
  const res = await fetch("events.json");
  events = await res.json();
}

// --- Utility functions ---

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function renderTemplate(template, tributes) {
  return template.replace(/\{(\d+)\}/g, (_, idx) => {
    const t = tributes[idx];
    return t ? t.name : "";
  });
}

// --- Parsing tributes ---

function parseTributes(input) {
  const lines = input.split("\n").map(l => l.trim()).filter(Boolean);
  return lines.map((line, idx) => {
    const parts = line.split(",");
    const name = parts[0]?.trim() ?? `Tribute ${idx + 1}`;
    const district = parts[1]?.trim() ?? "?";
    const imageUrl = parts[2]?.trim() || null;
    return new Tribute(idx, name, district, imageUrl);
  });
}

// --- Simulation helpers ---

function getAliveTributes() {
  return state.tributes.filter(t => t.alive);
}

function pickEvent(availableCount) {
  const candidates = events.filter(
    e =>
      e.minParticipants <= availableCount &&
      e.maxParticipants >= e.minParticipants &&
      e.maxParticipants <= availableCount
  );
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// returns event text
function resolveEvent(event, pool) {
  const count = event.maxParticipants;
  const participants = pool.splice(0, count);

  // Apply fatalities to first N participants
  for (let i = 0; i < event.fatalities; i++) {
    if (participants[i]) {
      participants[i].alive = false;
    }
  }

  return renderTemplate(event.descriptionTemplate, participants);
}

// --- Phase step ---

function stepPhase() {
  const alive = getAliveTributes();

  // Check for winner/end
  if (alive.length <= 1) {
    const phaseTitle = "Final Result";
    const phaseEvents = [];

    if (alive.length === 1) {
      phaseEvents.push(`${alive[0].name} wins the Hunger Games!`);
    } else {
      phaseEvents.push("No one survives.");
    }

    state.phases.push({ title: phaseTitle, events: phaseEvents });
    renderPhaseScreen();
    document.getElementById("nextBtn").disabled = true;
    return;
  }

  const phaseTitle = `${phaseNames[state.phaseIndex]} (Day ${state.day})`;
  const phaseEvents = [];

  let pool = shuffle([...alive]);

  while (pool.length > 0) {
    const event = pickEvent(pool.length);
    if (!event) break;
    const text = resolveEvent(event, pool);
    phaseEvents.push(text);
  }

  state.phases.push({ title: phaseTitle, events: phaseEvents });

  // Advance phase/day
  state.phaseIndex = (state.phaseIndex + 1) % phaseNames.length;
  if (state.phaseIndex === 0) {
    state.day += 1;
  }

  renderPhaseScreen();
}

// --- UI rendering ---

function renderTributes() {
  const tributesDiv = document.getElementById("tributes");
  tributesDiv.innerHTML = "";

  state.tributes.forEach(t => {
    const div = document.createElement("div");
    div.className = "tribute";
    if (!t.alive) div.classList.add("dead");

    if (t.imageUrl) {
      const img = document.createElement("img");
      img.src = t.imageUrl;
      img.alt = t.name;
      div.appendChild(img);
    }

    const text = document.createElement("span");
    text.textContent = `${t.name} (D${t.district})`;
    div.appendChild(text);

    tributesDiv.appendChild(div);
  });
}

function renderPhaseScreen() {
  const latest = state.phases[state.phases.length - 1];

  const titleEl = document.getElementById("phaseTitle");
  titleEl.textContent = latest.title;

  const logDiv = document.getElementById("log");
  logDiv.innerHTML = "";
  latest.events.forEach(text => {
    const p = document.createElement("p");
    p.textContent = text;
    logDiv.appendChild(p);
  });

  renderTributes();
}

// --- Wiring ---

document.getElementById("startBtn").addEventListener("click", async () => {
  await loadEvents();

  const input = document.getElementById("tributeInput").value;
  state.tributes = parseTributes(input);
  state.day = 1;
  state.phaseIndex = 0;
  state.phases = [];

  document.getElementById("setup").classList.add("hidden");
  document.getElementById("sim").classList.remove("hidden");
  document.getElementById("nextBtn").disabled = false;

  // First phase render (before any events)
  state.phases.push({
    title: `${phaseNames[state.phaseIndex]} (Day ${state.day})`,
    events: ["The Hunger Games begin!"]
  });
  renderPhaseScreen();
});

document.getElementById("nextBtn").addEventListener("click", () => {
  stepPhase();
});

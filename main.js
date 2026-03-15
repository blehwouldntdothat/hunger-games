// =========================
// DATA MODELS
// =========================

class Tribute {
  constructor(id, name, district, imageUrl = "") {
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
  phases: []
};

let events = [];
let cast = []; // editable cast array


// =========================
// LOAD EVENTS
// =========================

async function loadEvents() {
  const res = await fetch("events.json");
  events = await res.json();
}


// =========================
// CAST GENERATION + EDITING
// =========================

function generatePlaceholderCast(size) {
  cast = [];
  for (let i = 0; i < size; i++) {
    cast.push({
      name: `Tribute ${i + 1}`,
      district: ((i % 12) + 1).toString(),
      imageUrl: ""
    });
  }
  updateCastPreview();
}

function updateCastPreview() {
  const preview = document.getElementById("castPreview");
  preview.innerHTML = "";

  cast.forEach((t, i) => {
    const card = document.createElement("div");
    card.className = "cast-card";

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = t.name;

    const img = document.createElement("img");
    img.src =
      t.imageUrl ||
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdqLQxWyonrlxQ-evBP576SxutCnveCYkYGw&s";
    img.alt = t.name;

    const dist = document.createElement("div");
    dist.className = "district";
    dist.textContent = `District ${t.district}`;

    card.appendChild(name);
    card.appendChild(img);
    card.appendChild(dist);

    preview.appendChild(card);
  });
}

function openCastEditor() {
  const form = document.getElementById("castForm");
  form.innerHTML = "";

  cast.forEach((t, i) => {
    const row = document.createElement("div");
    row.innerHTML = `
      <strong>${i + 1}</strong>
      <input type="text" placeholder="Name" value="${t.name}" data-index="${i}" data-field="name" />
      <input type="text" placeholder="District" value="${t.district}" data-index="${i}" data-field="district" />
      <input type="text" placeholder="Image URL" value="${t.imageUrl}" data-index="${i}" data-field="imageUrl" />
    `;
    form.appendChild(row);
  });
}

function saveCastEdits() {
  const inputs = document.querySelectorAll("#castForm input");

  inputs.forEach(input => {
    const index = parseInt(input.dataset.index);
    const field = input.dataset.field;
    cast[index][field] = input.value.trim();
  });

  updateCastPreview();
}


// =========================
// SIMULATION HELPERS
// =========================

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function renderTemplate(template, tributes) {
  return template.replace(/\{(\d+)\}/g, (_, idx) => tributes[idx]?.name || "");
}

function getAliveTributes() {
  return state.tributes.filter(t => t.alive);
}

function pickEvent(availableCount) {
  const candidates = events.filter(
    e =>
      e.minParticipants <= availableCount &&
      e.maxParticipants <= availableCount
  );
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function resolveEvent(event, pool) {
  const count = event.maxParticipants;
  const participants = pool.splice(0, count);

  for (let i = 0; i < event.fatalities; i++) {
    if (participants[i]) participants[i].alive = false;
  }

  return renderTemplate(event.descriptionTemplate, participants);
}


// =========================
// PHASE LOGIC
// =========================

function stepPhase() {
  const alive = getAliveTributes();

  if (alive.length <= 1) {
    const title = "Final Result";
    const eventsArr = [];

    if (alive.length === 1) {
      eventsArr.push(`${alive[0].name} wins the Hunger Games!`);
    } else {
      eventsArr.push("No one survives.");
    }

    state.phases.push({ title, events: eventsArr });
    renderPhaseScreen();
    document.getElementById("nextBtn").disabled = true;
    return;
  }

  const title = `${phaseNames[state.phaseIndex]} (Day ${state.day})`;
  const phaseEvents = [];

  let pool = shuffle([...alive]);

  while (pool.length > 0) {
    const event = pickEvent(pool.length);
    if (!event) break;
    phaseEvents.push(resolveEvent(event, pool));
  }

  state.phases.push({ title, events: phaseEvents });

  state.phaseIndex = (state.phaseIndex + 1) % phaseNames.length;
  if (state.phaseIndex === 0) state.day++;

  renderPhaseScreen();
}


// =========================
// UI RENDERING
// =========================

function renderTributes() {
  const div = document.getElementById("tributes");
  div.innerHTML = "";

  state.tributes.forEach(t => {
    const card = document.createElement("div");
    card.className = "cast-card small-card";
    if (!t.alive) card.classList.add("dead");

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = t.name;

    const img = document.createElement("img");
    img.src =
      t.imageUrl ||
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdqLQxWyonrlxQ-evBP576SxutCnveCYkYGw&s";
    img.alt = t.name;

    const dist = document.createElement("div");
    dist.className = "district";
    dist.textContent = `District ${t.district}`;

    card.appendChild(name);
    card.appendChild(img);
    card.appendChild(dist);

    div.appendChild(card);
  });
}

function renderPhaseScreen() {
  const latest = state.phases[state.phases.length - 1];

  document.getElementById("phaseTitle").textContent = latest.title;

  const log = document.getElementById("log");
  log.innerHTML = "";

  latest.events.forEach(eventText => {
    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "20px";

    const names = state.tributes.map(t => t.name);
    const matched = names.filter(n => eventText.includes(n));

    const imgRow = document.createElement("div");
    imgRow.style.display = "flex";
    imgRow.style.gap = "12px";
    imgRow.style.marginBottom = "8px";

    matched.forEach(name => {
      const t = state.tributes.find(x => x.name === name);
      if (!t) return;

      const card = document.createElement("div");
      card.className = "cast-card";
      card.style.width = "120px";

      const nm = document.createElement("div");
      nm.className = "name";
      nm.textContent = t.name;

      const img = document.createElement("img");
      img.src =
        t.imageUrl ||
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdqLQxWyonrlxQ-evBP576SxutCnveCYkYGw&s";
      img.alt = t.name;

      const dist = document.createElement("div");
      dist.className = "district";
      dist.textContent = `District ${t.district}`;

      card.appendChild(nm);
      card.appendChild(img);
      card.appendChild(dist);

      imgRow.appendChild(card);
    });

    wrapper.appendChild(imgRow);

    const p = document.createElement("p");
    p.textContent = eventText;
    wrapper.appendChild(p);

    log.appendChild(wrapper);
  });

  renderTributes();
}


// =========================
// EVENT LISTENERS
// =========================

document.getElementById("castSize").addEventListener("input", e => {
  const size = parseInt(e.target.value);
  document.getElementById("castSizeLabel").textContent = size;
  generatePlaceholderCast(size);
});

document.getElementById("editCastBtn").addEventListener("click", () => {
  document.getElementById("castEditor").classList.remove("hidden");
  openCastEditor();
});

document.getElementById("saveCastBtn").addEventListener("click", () => {
  saveCastEdits();
  document.getElementById("castEditor").classList.add("hidden");
});

document.getElementById("startBtn").addEventListener("click", async () => {
  await loadEvents();

  state.tributes = cast.map((t, i) =>
    new Tribute(i, t.name, t.district, t.imageUrl)
  );

  state.day = 1;
  state.phaseIndex = 0;
  state.phases = [];

  document.getElementById("setup").classList.add("hidden");
  document.getElementById("sim").classList.remove("hidden");
  document.getElementById("nextBtn").disabled = false;

  state.phases.push({
    title: `${phaseNames[state.phaseIndex]} (Day ${state.day})`,
    events: ["The Hunger Games begin!"]
  });

  renderPhaseScreen();
});

document.getElementById("nextBtn").addEventListener("click", () => {
  stepPhase();
});


// =========================
// INITIALIZE DEFAULT CAST
// =========================

generatePlaceholderCast(10);

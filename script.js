let players = [];
let alive = [];
let day = 1;

function addPlayer() {
  let name = document.getElementById("playerName").value;
  players.push({name: name, alive: true});
  document.getElementById("playerList").innerHTML += `<li>${name}</li>`;
}

function startGame() {
  alive = [...players];
  document.getElementById("setup").style.display = "none";
  document.getElementById("game").style.display = "block";
  nextDay();
}

function nextDay() {
  document.getElementById("dayTitle").innerText = "Day " + day;

  let event = randomEvent();

  document.getElementById("events").innerHTML += `<p>${event}</p>`;

  day++;

  if (alive.length > 1) {
    setTimeout(nextDay, 2000);
  } else {
    document.getElementById("events").innerHTML += `<h2>${alive[0].name} wins!</h2>`;
  }
}

function randomEvent() {
  let a = alive[Math.floor(Math.random()*alive.length)];
  let b = alive[Math.floor(Math.random()*alive.length)];

  if (Math.random() < 0.3 && a !== b) {
    b.alive = false;
    alive = alive.filter(p => p.alive);
    return `${a.name} eliminates ${b.name}`;
  }

  return `${a.name} searches for supplies`;
}

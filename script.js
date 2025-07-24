const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -1,
});

// Define image dimensions
const imageWidth = 2302;
const imageHeight = 1314;
const bounds = [[0, 0], [imageHeight, imageWidth]];

// Add image overlay
L.imageOverlay('ite.png', bounds).addTo(map);
map.fitBounds(bounds);

// Define game locations using VALID pixel coordinates
const locations = [
  { x: 1300, y: -476, clue: "📚 Find the lion that guards the knowledge!", level: 1 },
  { x: 1770, y: -492, clue: "🕰️ Where time flows backward?", level: 2 },
];

let currentLevel = 0;
let unlockedLevel = 1;
let teamName = '';
let className = '';
const markers = [];

// Define custom bright red marker icon
const redMarkerIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 8.84 16 24 16 24s16-15.16 16-24C32 7.16 24.84 0 16 0z" fill="#FF0000" />
      <circle cx="16" cy="16" r="5" fill="#FFFFFF" />
    </svg>
  `,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
});

// Create markers with custom red icon
locations.forEach(loc => {
  const latlng = map.unproject([loc.x, loc.y], 0);
  const marker = L.marker(latlng, { icon: redMarkerIcon });
  marker.bindPopup(`Level ${loc.level}`);
  marker.on('click', () => {
    startLevel(loc.level, loc.clue);
  });
  markers.push(marker);
});

// Handle team form submission
document.getElementById('team-form').addEventListener('submit', function (e) {
  e.preventDefault();
  teamName = document.getElementById('team-name').value.trim();
  className = document.getElementById('class-name').value.trim();
  if (teamName && className) {
    document.getElementById('team-form-overlay').style.display = 'none';
    document.getElementById('map').style.display = 'block';
    markers[0].addTo(map);
    startLevel(1, locations[0].clue);
  } else {
    alert('Please enter both team name and class.');
  }
});

function startLevel(level, clue) {
  if (level !== unlockedLevel) {
    alert("🚫 You must unlock this level first!");
    return;
  }
  currentLevel = level;
  const clueTitle = document.getElementById('clue-title');
  const clueText = document.getElementById('clue-text');
  const clueBox = document.getElementById('clue-box');
  const completeBtn = document.getElementById('complete-level-btn');

  if (clueTitle && clueText && clueBox) {
    clueTitle.innerText = `Level ${level}`;
    clueText.innerText = clue;
    clueBox.style.display = 'block';
  }

  if (completeBtn) {
    completeBtn.style.display = 'none';
  }
}

// Upload file and metadata to Google Apps Script web app
function uploadToDrive() {
  const fileInput = document.getElementById("media-upload");
  const file = fileInput.files[0];
  if (!file) {
    alert("Please select a photo or video to upload.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const base64Data = e.target.result.split(',')[1];

    const payload = {
      filename: `Level${currentLevel}_${teamName}_${className}_${Date.now()}_${file.name}`,
      type: file.type,
      data: base64Data,
      team: teamName,    // Matches Apps Script keys
      class: className,  // Matches Apps Script keys
    };

    fetch("https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec", { // Replace YOUR_SCRIPT_ID
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(json => {
      if (json.status === "success") {
        alert("✅ Upload successful!");
        const completeBtn = document.getElementById('complete-level-btn');
        if (completeBtn) completeBtn.style.display = 'inline-block';
      } else {
        alert("❌ Upload failed: " + json.message);
      }
    })
    .catch(err => alert("❌ Error: " + err.message));
  };

  reader.onerror = function () {
    alert("❌ File reading failed: " + reader.error.message);
  };

  reader.readAsDataURL(file);
}

function completeLevel() {
  alert(`✅ Level ${currentLevel} completed!`);
  document.getElementById('clue-box').style.display = 'none';
  updateScoreboard(`${teamName} completed Level ${currentLevel}`);

  if (currentLevel === unlockedLevel) {
    const currentMarker = markers[currentLevel - 1];
    if (currentMarker) {
      map.removeLayer(currentMarker);
    }
    unlockedLevel++;
    const nextMarker = markers[unlockedLevel - 1];
    if (nextMarker) {
      nextMarker.addTo(map);
      const nextLocation = locations[unlockedLevel - 1];
      if (nextLocation) startLevel(nextLocation.level, nextLocation.clue);
    }
  }
}

function updateScoreboard(entry) {
  const scoreboard = document.getElementById('scoreboard');
  const scoreList = document.getElementById('score-list');
  const li = document.createElement('li');
  li.textContent = entry;
  li.setAttribute('data-team', teamName);
  li.setAttribute('data-class', className);
  scoreList.appendChild(li);
  scoreboard.style.display = 'block';
}

// Debug: click on map to get pixel coordinates
map.on('click', function (e) {
  const point = map.project(e.latlng, 0);
  alert(`Pixel Coordinates: x=${Math.round(point.x)}, y=${Math.round(point.y)}`);
});

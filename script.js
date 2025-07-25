console.log("script.js loaded");

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start-game-btn').addEventListener('click', submitTeamDetails);
});

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
  { x: 1766, y: -866, clue: "📚 Find the place that have unlimited knowledge, Section L32 will be your door, Red and White cover - page 238 is your clue, read the passage, record it and upload for points", level: 1 },
  { x: 1630, y: -510, clue: "🕰️ This is the history of the school, take a welfie with it and upload for points", level: 2 },
];

let currentLevel = 0;
let unlockedLevel = 1;
let team = '';
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
  marker.on('click', () => startLevel(loc.level, loc.clue));
  markers.push(marker);
});

// Show only first marker
markers[0].addTo(map);

// Show team form on page load
document.getElementById('team-form-overlay').style.display = 'flex';

function submitTeamDetails() {
  team = document.getElementById('team-name').value.trim();
  className = document.getElementById('team-class').value.trim();
  if (!team || !className) {
    alert("Please enter both Team Name and Class.");
    return;
  }
  document.getElementById('team-form-overlay').style.display = 'none';
}

function startLevel(level, clue) {
  if (level !== unlockedLevel) {
    alert("🚫 You must unlock this level first!");
    return;
  }
  currentLevel = level;
  document.getElementById('clue-title').innerText = `Level ${level}`;
  document.getElementById('clue-text').innerText = clue;
  document.getElementById('clue-box').style.display = 'block';

  // Hide and disable Complete Level button initially
  const completeBtn = document.getElementById('complete-level-btn');
  if (completeBtn) {
    completeBtn.style.display = 'none';
    completeBtn.disabled = true;
  }

  // Clear previous file selection when starting new level
  document.getElementById("media-upload").value = "";
}

async function uploadToDrive() {
  const overlay = document.getElementById("loading-overlay");
  const fileInput = document.getElementById("media-upload");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a photo or video to upload.");
    return;
  }

  if (overlay) overlay.style.display = "flex";

  const reader = new FileReader();

  reader.onload = async function (e) {
    const base64Data = e.target.result.split(',')[1];
    const timestamp = new Date().toISOString();
    const payload = {
      filename: `Level${currentLevel}_${Date.now()}_${team}_${className}_${file.name}`,
      type: file.type,
      data: base64Data,
      team: team,
      class: className,
      timestamp: timestamp
    };

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbyF4Vn0FnFUD4Ay9hLh8bNLneJMFHvMsD1RyOtgNVLVLp4LtDkjoegGNGqY1LKxTQzySg/exec",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        alert("❌ Upload failed.");
        return;
      }

      if (result.status === "success") {
        alert("✅ Upload successful!");
        const completeBtn = document.getElementById('complete-level-btn');
        if (completeBtn) {
          completeBtn.style.display = 'inline-block';
          completeBtn.disabled = false; // Enable only after successful upload
        }
      } else {
        alert("❌ Upload failed. Please try again.");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("❌ Upload failed.");
    } finally {
      if (overlay) overlay.style.display = "none";
    }
  };

  reader.readAsDataURL(file);
}

function completeLevel() {
  alert(`✅ Level ${currentLevel} completed!`);
  document.getElementById('clue-box').style.display = 'none';
  updateScoreboard(`${team} (${className}) completed Level ${currentLevel}`);

  if (currentLevel === unlockedLevel) {
    const currentMarker = markers[currentLevel - 1];
    if (currentMarker) {
      console.log(`Removing marker for Level ${currentLevel}`);
      map.removeLayer(currentMarker);
    } else {
      console.log(`No marker found for Level ${currentLevel}`);
    }

    unlockedLevel++;
    const nextMarker = markers[unlockedLevel - 1];
    if (nextMarker) {
      console.log(`Adding marker for Level ${unlockedLevel}`);
      nextMarker.addTo(map);
    } else {
      console.log(`No marker found for Level ${unlockedLevel}`);
    }
  }

  // Clear file input after level completion
  document.getElementById("media-upload").value = "";
}

function updateScoreboard(entry) {
  const scoreboard = document.getElementById('scoreboard');
  const scoreList = document.getElementById('score-list');
  const li = document.createElement('li');
  li.textContent = entry;
  scoreList.appendChild(li);
  scoreboard.style.display = 'block';
}

map.on('click', function (e) {
  const point = map.project(e.latlng, 0);
  console.log(`Clicked Pixel Coordinates: x=${Math.round(point.x)}, y=${Math.round(point.y)}`);
  alert(`Pixel Coordinates: x=${Math.round(point.x)}, y=${Math.round(point.y)}`);
});

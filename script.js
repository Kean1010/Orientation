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
  { x: 1300, y: -476, clue: "📚 Find the lion that guards the knowledge!", level: 1 },
  { x: 1770, y: -492, clue: "🕰️ Where time flows backward?", level: 2 },
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
  iconAnchor: [16, 40], // Anchor at the bottom center of the marker
  popupAnchor: [0, -40], // Popup appears above the marker
});

// Create markers with custom red icon
locations.forEach(loc => {
  const latlng = map.unproject([loc.x, loc.y], 0); // Use zoom level 0 for CRS.Simple
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

  const completeBtn = document.getElementById('complete-level-btn');
  if (completeBtn) completeBtn.style.display = 'none';
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
        "https://script.google.com/macros/s/AKfycbya3gVaouVUDa_xL316_hwqJFuHtxCI1rJwq1U_miz4TtVsY73XGjv_GDLDFVjuo-H3MA/exec",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      // Log raw response for debugging
      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        alert(`❌ Upload failed: Invalid server response - ${responseText}`);
        return;
      }

      if (result.status === "success") {
        alert(`✅ Upload successful! File URL: ${result.fileUrl}`);
        const completeBtn = document.getElementById('complete-level-btn');
        if (completeBtn) completeBtn.style.display = 'inline-block';
      } else {
        alert(`❌ Upload failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert(`❌ Upload failed: ${error.message}`);
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
    // Remove the current marker using its index
    const currentMarker = markers[currentLevel - 1]; // Index is level - 1
    if (currentMarker) {
      console.log(`Removing marker for Level ${currentLevel}`);
      map.removeLayer(currentMarker);
    } else {
      console.log(`No marker found for Level ${currentLevel}`);
    }

    // Increment unlocked level and add the next marker
    unlockedLevel++;
    const nextMarker = markers[unlockedLevel - 1]; // Index is unlockedLevel - 1
    if (nextMarker) {
      console.log(`Adding marker for Level ${unlockedLevel}`);
      nextMarker.addTo(map);
    } else {
      console.log(`No marker found for Level ${unlockedLevel}`);
    }
  }
}

function updateScoreboard(entry) {
  const scoreboard = document.getElementById('scoreboard');
  const scoreList = document.getElementById('score-list');
  const li = document.createElement('li');
  li.textContent = entry;
  scoreList.appendChild(li);
  scoreboard.style.display = 'block';
}

// Debug: click to get pixel coords
map.on('click', function (e) {
  const point = map.project(e.latlng, 0);
  console.log(`Clicked Pixel Coordinates: x=${Math.round(point.x)}, y=${Math.round(point.y)}`);
  alert(`Pixel Coordinates: x=${Math.round(point.x)}, y=${Math.round(point.y)}`);
});

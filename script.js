// Map setup with CRS.Simple
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -1
});

// Image dimensions (pixels)
const imageWidth = 2302;
const imageHeight = 1314;
const bounds = [[0, 0], [imageHeight, imageWidth]];

// Add image overlay and fit bounds
L.imageOverlay('ite.png', bounds).addTo(map);
map.fitBounds(bounds);

// Locations: x = horizontal pixel, y = vertical pixel (from top)
const locations = [
  { x: 1507, y: 516, clue: "📚 Find the lion that guards the knowledge!", level: 1 },
  { x: 1200, y: 700, clue: "🕰️ Where time flows backward?", level: 2 }
];

let currentLevel = 0;
let unlockedLevel = 1; // Start unlocked level 1
const markers = [];

// Create markers, flipping Y coordinate to fit Leaflet's CRS.Simple system
locations.forEach(loc => {
  const latlng = map.unproject([loc.x, imageHeight - loc.y], map.getMaxZoom());
  const marker = L.marker(latlng);
  marker.bindPopup(`Level ${loc.level}`);
  marker.on('click', () => {
    startLevel(loc.level, loc.clue);
  });
  markers.push(marker);
});

// Show only the first marker initially
markers[0].addTo(map);

function startLevel(level, clue) {
  if (level !== unlockedLevel) {
    alert("🚫 You must unlock this level first!");
    return;
  }
  currentLevel = level;
  document.getElementById('clue-title').innerText = `Level ${level}`;
  document.getElementById('clue-text').innerText = clue;
  document.getElementById('clue-box').style.display = 'block';

  // Hide "Complete Level" button until upload success
  document.getElementById('complete-btn').style.display = 'none';
}

async function uploadToDrive() {
  const overlay = document.getElementById("loading-overlay");
  const fileInput = document.getElementById("media-upload");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a photo or video to upload.");
    return;
  }

  overlay.style.display = "flex";

  const reader = new FileReader();

  reader.onload = async function (e) {
    const base64Data = e.target.result.split(',')[1];
    const payload = {
      filename: `Level${currentLevel}_${Date.now()}_${file.name}`,
      type: file.type,
      data: base64Data
    };

    try {
      const response = await fetch("https://script.google.com/macros/s/AKfycbya3gVaouVUDa_xL316_hwqJFuHtxCI1rJwq1U_miz4TtVsY73XGjv_GDLDFVjuo-H3MA/exec", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      const result = await response.text();
      if (result.includes("success")) {
        alert("✅ Upload successful!");
        // Show "Complete Level" button
        document.getElementById('complete-btn').style.display = 'inline-block';
      } else {
        alert("❌ " + result);
      }
    } catch (error) {
      alert("❌ Upload failed: " + error.message);
    } finally {
      overlay.style.display = "none";
    }
  };

  reader.readAsDataURL(file);
}

function completeLevel() {
  alert(`✅ Level ${currentLevel} completed!`);
  document.getElementById('clue-box').style.display = 'none';
  updateScoreboard(`Player 1 completed Level ${currentLevel}`);

  // Unlock next level
  if (currentLevel === unlockedLevel) {
    unlockedLevel++;
    // Show next marker if exists
    const nextMarker = markers.find(m => m.getPopup().getContent() === `Level ${unlockedLevel}`);
    if (nextMarker) {
      nextMarker.addTo(map);
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

// Add event listeners for buttons
document.getElementById('upload-btn').addEventListener('click', uploadToDrive);
document.getElementById('complete-btn').addEventListener('click', completeLevel);

// Coordinate picker (optional, for your setup)
map.on('click', function (e) {
  const point = map.project(e.latlng, 0);
  const x = Math.round(point.x);
  const y = Math.round(imageHeight - point.y); // Flip Y axis for human-readable coordinates
  console.log(`Clicked Pixel Coordinates: x=${x}, y=${y}`);
  // alert(`Pixel Coordinates: x=${x}, y=${y}`); // uncomment if needed
});

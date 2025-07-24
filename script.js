// 1. Use CRS.Simple for image-based map
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -1,
});

// 2. Define image dimensions
const imageWidth = 2302;
const imageHeight = 1314;
const bounds = [[0, 0], [imageHeight, imageWidth]];

// 3. Add image overlay
L.imageOverlay('ite.png', bounds).addTo(map);
map.fitBounds(bounds);

// 4. Define game locations using VALID pixel coordinates (replace with ones you click)
const locations = [
  { x: 1151, y: 650, clue: "📚 Find the lion that guards the knowledge!", level: 1 },
  { x: 1300, y: 650, clue: "🕰️ Where time flows backward?", level: 2 },
];

let currentLevel = 0;
let unlockedLevel = 1;
const markers = [];

// Create markers
locations.forEach(loc => {
  const latlng = map.unproject([loc.x, loc.y], map.getMaxZoom());
  const marker = L.marker(latlng);
  marker.bindPopup(`Level ${loc.level}`);
  marker.on('click', () => startLevel(loc.level, loc.clue));
  markers.push(marker);
});

// Show only first marker
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
    const payload = {
      filename: `Level${currentLevel}_${Date.now()}_${file.name}`,
      type: file.type,
      data: base64Data,
    };

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbya3gVaouVUDa_xL316_hwqJFuHtxCI1rJwq1U_miz4TtVsY73XGjv_GDLDFVjuo-H3MA/exec",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const result = await response.text();
      if (result.includes("success")) {
        alert("✅ Upload successful!");
        const completeBtn = document.getElementById('complete-level-btn');
        if (completeBtn) completeBtn.style.display = 'inline-block';
      } else {
        alert("❌ " + result);
      }
    } catch (error) {
      alert("❌ Upload failed: " + error.message);
    } finally {
      if (overlay) overlay.style.display = "none";
    }
  };

  reader.readAsDataURL(file);
}

function completeLevel() {
  alert(`✅ Level ${currentLevel} completed!`);
  document.getElementById('clue-box').style.display = 'none';
  updateScoreboard(`Player 1 completed Level ${currentLevel}`);

  if (currentLevel === unlockedLevel) {
    unlockedLevel++;
    const nextMarker = markers.find(m => m.getPopup().getContent() === `Level ${unlockedLevel}`);
    if (nextMarker) nextMarker.addTo(map);
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

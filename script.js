const map = L.map('map').setView([1.3521, 103.8198], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const locations = [
  { lat: 1.2966, lng: 103.7764, clue: "📚 Find the lion that guards the knowledge!", level: 1 },
  { lat: 1.3048, lng: 103.8318, clue: "🕰️ Where time flows backward?", level: 2 }
];

let currentLevel = 0;
let unlockedLevel = 1; // Only Level 1 is unlocked at start

// Store markers separately so we can enable/disable them
const markers = [];

locations.forEach(loc => {
  const marker = L.marker([loc.lat, loc.lng]).addTo(map);
  marker.bindPopup(`Level ${loc.level}`);
  marker.on('click', () => {
    if (loc.level <= unlockedLevel) {
      startLevel(loc.level, loc.clue);
    } else {
      alert(`🚫 You must clear Level ${loc.level - 1} first!`);
    }
  });
  markers.push(marker);
});

function startLevel(level, clue) {
  currentLevel = level;
  document.getElementById('clue-title').innerText = `Level ${level}`;
  document.getElementById('clue-text').innerText = clue;
  document.getElementById('clue-box').style.display = 'block';
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
      alert(result.includes("success") ? "✅ Upload successful!" : "❌ " + result);
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

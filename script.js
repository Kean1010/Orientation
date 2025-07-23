const map = L.map('map').setView([1.3521, 103.8198], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const locations = [
  { lat: 1.2966, lng: 103.7764, clue: "📚 Find the lion that guards the knowledge!", level: 1 },
  { lat: 1.3048, lng: 103.8318, clue: "🕰️ Where time flows backward?", level: 2 }
];

let currentLevel = 0;

locations.forEach(loc => {
  const marker = L.marker([loc.lat, loc.lng]).addTo(map);
  marker.bindPopup(`Level ${loc.level}`).on('click', () => {
    startLevel(loc.level, loc.clue);
  });
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

  overlay.style.display = "flex";  // Show loading overlay

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
      overlay.style.display = "none";  // Hide loading overlay no matter what
    }
  };

  reader.readAsDataURL(file);
}

function completeLevel() {
  alert(`✅ Level ${currentLevel} completed!`);
  document.getElementById('clue-box').style.display = 'none';
  updateScoreboard(`Player 1 completed Level ${currentLevel}`);
}

function updateScoreboard(entry) {
  const scoreboard = document.getElementById('scoreboard');
  const scoreList = document.getElementById('score-list');
  const li = document.createElement('li');
  li.textContent = entry;
  scoreList.appendChild(li);
  scoreboard.style.display = 'block';
}

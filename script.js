console.log("script.js loaded");

document.addEventListener('DOMContentLoaded', () => {
  // Retrieve saved team and game state from localStorage
  const savedTeam = localStorage.getItem('team');
  const savedClass = localStorage.getItem('className');
  const savedCurrentStage = localStorage.getItem('currentStage');
  const savedUnlockedStage = localStorage.getItem('unlockedStage');
  const savedScores = JSON.parse(localStorage.getItem('scoreboard') || '[]');
  const teamInput = document.getElementById('team-name');
  const classInput = document.getElementById('team-class');

  if (savedTeam && savedClass) {
    // Pre-fill form and restore game state
    teamInput.value = savedTeam;
    classInput.value = savedClass;
    team = savedTeam;
    className = savedClass;
    document.getElementById('team-form-overlay').style.display = 'none';

    // Restore stage progress
    if (savedCurrentStage) currentStage = parseInt(savedCurrentStage);
    if (savedUnlockedStage) {
      unlockedStage = parseInt(savedUnlockedStage);
      // Update map markers based on unlockedStage
      markers.forEach((marker, index) => {
        if (index < unlockedStage - 1) {
          map.removeLayer(marker); // Remove markers for completed stages
        } else if (index === unlockedStage - 1) {
          marker.addTo(map); // Add marker for the current unlocked stage
        }
      });
      // Enable certificate button if game is completed
      if (unlockedStage > locations.length) {
        document.getElementById('recall-certificate-btn').disabled = false;
      }
    }

    // Restore scoreboard
    savedScores.forEach(entry => updateScoreboard(entry, false));
  } else {
    // Show team form if no saved details
    document.getElementById('team-form-overlay').style.display = 'flex';
  }

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
  { x: 1766, y: -866, clue: "📚 Find the place that have unlimited knowledge, Section L32 will be your door, Red and White cover - page 238 is your clue, read the passage, record it and upload for points", stage: 1 },
  { x: 1630, y: -510, clue: "🕰️ This is the history of the school, take a welfie with it and upload for points", stage: 2 },
];

let currentStage = 0;
let unlockedStage = 1;
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
  marker.bindPopup(`Stage ${loc.stage}`);
  marker.on('click', () => startStage(loc.stage, loc.clue));
  markers.push(marker);
});

// Show only first marker
markers[0].addTo(map);

function submitTeamDetails() {
  team = document.getElementById('team-name').value.trim();
  className = document.getElementById('team-class').value.trim();
  if (!team || !className) {
    alert("Please enter both Team Name and Class.");
    return;
  }
  // Save team details to localStorage
  localStorage.setItem('team', team);
  localStorage.setItem('className', className);
  document.getElementById('team-form-overlay').style.display = 'none';
}

function startStage(stage, clue) {
  if (stage !== unlockedStage) {
    alert("🚫 You must unlock this stage first!");
    return;
  }
  currentStage = stage;
  document.getElementById('clue-title').innerText = `Stage ${stage}`;
  document.getElementById('clue-text').innerText = clue;
  document.getElementById('clue-overlay').style.display = 'flex';

  // Hide and disable Complete Stage button initially
  const completeBtn = document.getElementById('complete-level-btn');
  if (completeBtn) {
    completeBtn.style.display = 'inline-block';
    completeBtn.disabled = true;
  }

  // Clear previous file selection when starting new stage
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

  if (overlay) overlay.style.display = 'flex';

  const reader = new FileReader();

  reader.onload = async function (e) {
    const base64Data = e.target.result.split(',')[1];
    const timestamp = new Date().toISOString();
    const payload = {
      filename: `Stage${currentStage}_${Date.now()}_${team}_${className}_${file.name}`,
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
      if (overlay) overlay.style.display = 'none';
    }
  };

  reader.readAsDataURL(file);
}

function completeStage() {
  alert(`✅ Stage ${currentStage} completed!`);
  document.getElementById('clue-overlay').style.display = 'none';
  updateScoreboard(`${team} (${className}) completed Stage ${currentStage}`);

  if (currentStage === unlockedStage) {
    const currentMarker = markers[currentStage - 1];
    if (currentMarker) {
      console.log(`Removing marker for Stage ${currentStage}`);
      map.removeLayer(currentMarker);
    } else {
      console.log(`No marker found for Stage ${currentStage}`);
    }

    unlockedStage++;
    const nextMarker = markers[unlockedStage - 1];
    if (nextMarker) {
      console.log(`Adding marker for Stage ${unlockedStage}`);
      nextMarker.addTo(map);
    } else {
      console.log(`No marker found for Stage ${unlockedStage}`);
    }
  }

  // Save game state to localStorage
  localStorage.setItem('currentStage', currentStage);
  localStorage.setItem('unlockedStage', unlockedStage);

  // Check if all stages are completed
  if (unlockedStage > locations.length) {
    document.getElementById('certificate-team').textContent = team;
    document.getElementById('certificate-class').textContent = className;
    document.getElementById('certificate-date').textContent = new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' });
    document.getElementById('certificate-overlay').style.display = 'flex';
    document.getElementById('recall-certificate-btn').disabled = false; // Enable certificate button
  }

  // Clear file input after stage completion
  document.getElementById("media-upload").value = "";
}

function updateScoreboard(entry, save = true) {
  const scoreboard = document.getElementById('scoreboard');
  const scoreList = document.getElementById('score-list');
  
  // Prevent duplicate entries
  const currentScores = JSON.parse(localStorage.getItem('scoreboard') || '[]');
  if (currentScores.includes(entry)) {
    return; // Skip if entry already exists
  }

  const li = document.createElement('li');
  li.textContent = entry;
  scoreList.appendChild(li);
  scoreboard.style.display = 'block';

  // Save scoreboard to localStorage if not loading from saved state
  if (save) {
    currentScores.push(entry);
    localStorage.setItem('scoreboard', JSON.stringify(currentScores));
  }
}

function closeCertificate() {
  document.getElementById('certificate-overlay').style.display = 'none';
}

function closeClue() {
  document.getElementById('clue-overlay').style.display = 'none';
}

function showCertificate() {
  const savedTeam = localStorage.getItem('team');
  const savedClass = localStorage.getItem('className');
  if (savedTeam && savedClass) {
    document.getElementById('certificate-team').textContent = savedTeam;
    document.getElementById('certificate-class').textContent = savedClass;
    document.getElementById('certificate-date').textContent = new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' });
    document.getElementById('certificate-overlay').style.display = 'flex';
  }
}

function resetGame() {
  localStorage.removeItem('team');
  localStorage.removeItem('className');
  localStorage.removeItem('currentStage');
  localStorage.removeItem('unlockedStage');
  localStorage.removeItem('scoreboard');
  location.reload();
}

map.on('click', function (e) {
  const point = map.project(e.latlng, 0);
  console.log(`Clicked Pixel Coordinates: x=${Math.round(point.x)}, y=${Math.round(point.y)}`);
  alert(`Pixel Coordinates: x=${Math.round(point.x)}, y=${Math.round(point.y)}`);
});

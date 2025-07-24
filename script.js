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
  { x: 1300, y: 476, clue: "📚 Find the lion that guards the knowledge!", level: 1 },
  { x: 1770, y: 492, clue: "🕰️ Where time flows backward?", level: 2 },
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

// Handle team form submission
document.getElementById('team-form').addEventListener('submit', function (e) {
  e.preventDefault();
  teamName = document.getElementById('team-name').value.trim();
  className = document.getElementById('class-name').value.trim();
  if (teamName && className) {
    document.getElementById('team-form-overlay').style.display = 'none';
    document.getElementById('map').style.display = 'block';
    markers[0].addTo(map); // Show first marker after form submission
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

  if (overlay) {
    // Create progress bar
    const progressBar = document.createElement('progress');
    progressBar.id = 'upload-progress';
    progressBar.max = 100;
    progressBar.value = 0;
    progressBar.style.width = '80%';
    progressBar.style.marginTop = '20px';

    // Clear overlay content and add progress bar
    overlay.innerHTML = '<div>Processing file...</div>';
    overlay.appendChild(progressBar);
    overlay.style.display = "flex";
  }

  const reader = new FileReader();

  reader.onprogress = function (e) {
    if (e.lengthComputable) {
      const percentComplete = (e.loaded / e.total) * 100;
      console.log(`File reading progress: ${percentComplete}%`);
      const progressBar = document.getElementById('upload-progress');
      if (progressBar) {
        progressBar.value = percentComplete;
      } else {
        console.error('Progress bar element not found during file reading');
      }
    } else {
      console.log('File reading progress event fired, but lengthComputable is false');
    }
  };

  reader.onload = async function (e) {
    // Set progress to 100% when file reading completes
    const progressBar = document.getElementById('upload-progress');
    if (progressBar) {
      progressBar.value = 100;
      console.log('File reading complete: Progress set to 100%');
    }
    // Update overlay text to indicate uploading phase
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      overlay.firstChild.textContent = 'Uploading to server...';
    }

    const base64Data = e.target.result.split(',')[1];
    const payload = {
      filename: `Level${currentLevel}_${teamName}_${className}_${Date.now()}_${file.name}`,
      type: file.type,
      data: base64Data,
      teamName: teamName,
      className: className,
    };

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbya3gVaouVUDa_xL316_hwqJFuHtxCI1rJwq1U_miz4TtVsY73XGjv_GDLDFVjuo-H3MA/exec",
        {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
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
      console.error('Fetch error:', error.message);
      alert("❌ Upload failed: " + error.message);
    } finally {
      if (overlay) {
        overlay.style.display = "none";
        overlay.innerHTML = ''; // Clear progress bar
      }
    }
  };

  reader.onerror = function () {
    console.error('FileReader error:', reader.error);
    alert("❌ File reading failed: " + reader.error.message);
    if (overlay) {
      overlay.style.display = "none";
      overlay.innerHTML = '';
    }
  };

  reader.readAsDataURL(file);
}

function completeLevel() {
  alert(`✅ Level ${currentLevel} completed!`);
  document.getElementById('clue-box').style.display = 'none';
  updateScoreboard(`${teamName} completed Level ${currentLevel}`);

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
  li.setAttribute('data-team', teamName); // Add team name as data attribute
  li.setAttribute('data-class', className); // Add class as data attribute
  scoreList.appendChild(li);
  scoreboard.style.display = 'block';
}

// Debug: click to get pixel coords
map.on('click', function (e) {
  const point = map.project(e.latlng, 0);
  console.log(`Clicked Pixel Coordinates: x=${Math.round(point.x)}, y=${Math.round(point.y)}`);
  alert(`Pixel Coordinates: x=${Math.round(point.x)}, y=${Math.round(point.y)}`);
});

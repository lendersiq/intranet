/********************************************************
 * (A) KPI DATA 
 *******************************************************/
const kpis = {
  ROA: {
    label: "Return on Assets",
    data: [0.39, 0.43, 0.49, 0.42, 0.59, 0.56, 0.57],
    goal: .39,
    unit: '%'
  },
  Engagement: {
    label: "Employee Engagement",
    data: [72, 75, 70, 78, 81, 84, 79],
    goal: 90,
    unit: ''
  }
};

function renderAllKPIs() {
  const kpiGrid = document.getElementById("kpiGrid");
  kpiGrid.innerHTML = ""; // Clear existing content if re-rendering

  // For each KPI, create a card
  for (const key in kpis) {
    const { label, data, goal, unit } = kpis[key];
    
    // Current value is the last data point
    const currentValue = data[data.length - 1];

    // Build the KPI card
    const card = document.createElement("div");
    card.className = "kpi-card";

    const detailDiv = document.createElement("div");
    detailDiv.className = "kpi-details";

    // Primary label
    const labelEl = document.createElement("span");
    labelEl.className = "kpi-label";
    labelEl.textContent = label;

    // Main KPI value
    const valueEl = document.createElement("span");
    valueEl.className = "kpi-value";
    valueEl.textContent = currentValue.toFixed(2) + unit;

    // Compute the difference
    const difference = currentValue - goal;

    // Create a smaller text element for the difference
    const differenceEl = document.createElement("span");
    differenceEl.className = "kpi-difference"; // We'll style this in CSS
    differenceEl.textContent = `(${difference >= 0 ? "+" : ""}${difference.toFixed(2)}${unit} vs. goal)`;

    // Apply color based on positive/negative
    if (difference >= 0) {
      differenceEl.style.color = "green";  // or your complementary green
    } else {
      differenceEl.style.color = "crimson"; // or "ruby" / any red-like color
    }

    // Append elements
    detailDiv.appendChild(labelEl);
    detailDiv.appendChild(valueEl);
    detailDiv.appendChild(differenceEl);

    // Create sparkline canvas
    const sparkCanvas = document.createElement("canvas");
    sparkCanvas.className = "kpi-sparkline";
    sparkCanvas.width = 100;
    sparkCanvas.height = 40;

    // Put it all together
    card.appendChild(detailDiv);
    card.appendChild(sparkCanvas);
    kpiGrid.appendChild(card);

    // Draw sparkline using last 4 data points
    drawSparkline(sparkCanvas, data.slice(-4));
  }
}

function drawSparkline(canvas, dataArray) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const minVal = Math.min(...dataArray);
  const maxVal = Math.max(...dataArray);
  const xPadding = 5;
  const yPadding = 5;
  const xStep = (canvas.width - xPadding * 2) / (dataArray.length - 1);

  function getY(val) {
    const norm = (val - minVal) / (maxVal - minVal);
    return canvas.height - (norm * (canvas.height - yPadding * 2) + yPadding);
  }

  // line
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#008CFF"; // river blue
  dataArray.forEach((val, i) => {
    const x = xPadding + i * xStep;
    const y = getY(val);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // points
  ctx.fillStyle = "#E8BA44"; // sun yellow
  dataArray.forEach((val, i) => {
    const x = xPadding + i * xStep;
    const y = getY(val);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  });
}

/********************************************************
 * (B) ADVANCED AI SEARCH
 *     Steps: remove stop words, stem, find subject,
 *     map subject -> bookmark_key -> open doc
 *******************************************************/

// (1) Stop Words
const STOP_WORDS = new Set([
  "the", "and", "or", "is", "of", "in", "to", "for", "with", "a", "an", "on", "at", "by",
  // add as many as you like...
]);

// (2) Porter Stemmer (basic in-browser version)
// Source: https://tartarus.org/martin/PorterStemmer/  (JS port is widely available)
// Minimally included here for demonstration; you can use a library as well.
function porterStemmer(word) {
  // VERY minimal example, you could embed a real Porter Stemmer code
  // For brevity, let's do a naive approach:
  //  - remove common suffixes "ing", "ed", "s"
  // This is NOT a true full Porter algorithm, just a demonstration snippet.

  let w = word.toLowerCase();
  if (w.endsWith("ing")) {
    w = w.slice(0, -3);
  } else if (w.endsWith("ed")) {
    w = w.slice(0, -2);
  } else if (w.endsWith("s") && w.length > 1) {
    w = w.slice(0, -1);
  }
  return w;
}

// (3) Synonyms Dictionary (keys = "bookmark_keys")
// Each key has an array of synonyms (including itself).
// e.g., "vacation" => ["vacation", "vacations", "vacationing", "holiday", ...]
const SYNONYMS_DICT = {
  "vacation": ["vacation", "vacations", "vacationing", "holiday", "break"],
  "loan": ["loan", "loans", "mortgage", "financing", "credit"],
  "mortgage": ["mortgage", "loan", "financing", "credit"],
  "engagement": ["engagement", "involvement", "employee", "participation", "commitment"],
  // add more keys as needed
};

// (4) googleBookmarks keyed by "bookmark_key"
// e.g. googleBookmarks["vacation"] => "https://docs.google.com/..."
const googleBookmarks = {
  "vacation": "https://docs.google.com/document/d/5678/edit#bookmark=id.vacation",
  "loan": "https://docs.google.com/document/d/5678/edit#bookmark=id.loans",
  "mortgage": "https://docs.google.com/document/d/ABCD/edit#bookmark=id.mortgage",
  "engagement": "https://docs.google.com/document/d/XYZ/edit#bookmark=id.hr",
  // etc.
};

// (5) parseSearch
//    a) tokenize
//    b) remove stop words
//    c) stem
//    d) ascertain the subject by seeing if the resulting stem(s) match a key in synonyms
//       or if synonyms contain that stem
function parseSearch(query) {
  // Tokenize: lower + remove punctuation + split
  let tokens = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  // Remove stop words
  tokens = tokens.filter(t => !STOP_WORDS.has(t));

  // Stem each token
  const stemmedTokens = tokens.map(porterStemmer);

  // Return final array of stemmed tokens
  return stemmedTokens;
}

// (6) findSubjectFromTokens
// We'll do a simple approach:
//    for each token, check if it matches any synonyms in our dictionary.
//    If so, return that dictionary key as the subject.
// This means the first found subject will be used.
function findSubjectFromTokens(stemmedTokens) {
  for (const token of stemmedTokens) {
    // check each key in synonyms dict
    for (const [bookmarkKey, synonyms] of Object.entries(SYNONYMS_DICT)) {
      if (synonyms.includes(token)) {
        // found a match
        return bookmarkKey;
      }
    }
  }
  return null;
}

// (7) openDocForSubject
function openDocForSubject(subject) {
    const link = googleBookmarks[subject];
    if (!link) {
        return "No bookmark link found for: " + subject;
    }
    // Open in a new window/tab:
    window.open(link, "_blank", "noopener,noreferrer");
    return "Opening bookmark in a new window: " + link;
}


// (8) Main AI search function: orchestrates parse->subject->open
function advancedAiSearch(query) {
  const stemmedTokens = parseSearch(query);
  if (stemmedTokens.length === 0) {
    return "No valid tokens after removing stop words.";
  }
  const subject = findSubjectFromTokens(stemmedTokens);
  if (!subject) {
    return "No matching subject found in dictionary.";
  }
  // open doc
  return openDocForSubject(subject);
}

/********************************************************
 * (C) INIT + NAV/IFRAME + EVENT HANDLERS
 *******************************************************/
document.addEventListener("DOMContentLoaded", () => {
  // Render KPI cards
  renderAllKPIs();

  // Setup "intra-link" nav -> open in iframe
  const contentFrame = document.getElementById("contentFrame");
  document.querySelectorAll(".intra-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const url = link.getAttribute("data-url");
      contentFrame.src = url; // may or may not be iframable
    });
  });

  function handleSearch() {
    const aiSearchInput = document.getElementById("aiSearchInput");
    const aiSearchResults = document.getElementById("aiSearchResults");

    const query = aiSearchInput.value.trim();
    if (!query) {
    aiSearchResults.textContent = "Please enter a search.";
    return;
    }

    // Suppose advancedAiSearch is the function from your logic
    const resultMsg = advancedAiSearch(query);
    aiSearchResults.textContent = resultMsg;
  }

  const aiSearchInput = document.getElementById("aiSearchInput");

    // 1) BLUR event
    aiSearchInput.addEventListener("blur", () => {
        handleSearch();
    });

    // 2) KEYDOWN for Enter or Tab
    aiSearchInput.addEventListener("keydown", (event) => {
        // Check the pressed key
        if (event.key === "Enter") {
        // Prevent default form submission if applicable
        event.preventDefault();
        handleSearch();
        } else if (event.key === "Tab") {
        // Typically you might allow Tab to move focus, but if you'd like
        // to trigger the search on Tab, just call handleSearch here:
        // (Optionally, remove preventDefault so user can still tab away)
        // event.preventDefault(); // <== only if you DO NOT want the user to leave the field
        handleSearch();
        }
    });
});
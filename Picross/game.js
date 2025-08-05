let width = 15;
let height = 15;
let grid = Array(height).fill().map(() => Array(width).fill(0));
let solution = Array(height).fill().map(() => Array(width).fill(0));
let isEditMode = false;
let isHintMode = false; // New variable for hint capture mode
let isDragging = false;
let dragType = null;
let isSolvingPaused = false;
let gameIsPaused = false; // New flag to control the solving process

// Automatically start solving when the page loads
window.addEventListener("load", () => {
    console.log("Page loaded, starting solvePuzzle");
    const rowClues = getRowClues();
    const colClues = getColClues();
    const gridDiv = document.getElementById("grid");
    const cells = document.querySelectorAll(".cell").length;
    const height = document.getElementById("row-clues").children.length;
    const width = cells / height;
    solvePuzzle(rowClues, colClues, width, height);
});

// Update the puzzle ID display when the page loads
window.addEventListener("load", () => {
    const puzzleIdElement = document.getElementById("puzzle-id-value");
    const rowClues = getRowClues();
    // let puzzleId = rowClues.map(clue => clue.length > 0 ? clue.join(",") : "0").join(",");
    puzzleIdElement.textContent = puzzleId || "Unknown";
});

// Disable mouse interactions with the grid
document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("grid");
    if (grid) {
        grid.addEventListener("mousedown", (e) => e.preventDefault());
        grid.addEventListener("click", (e) => e.preventDefault());
    }
});

function addGridLines() {
    const gridDiv = document.getElementById("grid");
    const existingLines = gridDiv.querySelectorAll(".grid-line-h, .grid-line-v");
    existingLines.forEach(line => line.remove());

    if (width <= 10 && height <= 10) return;

    const cellSize = 20;
    const borderOffset = 1;

    for (let y = 5; y < height; y += 5) {
        const line = document.createElement("div");
        line.classList.add("grid-line-h");
        line.style.top = `${y * cellSize + borderOffset}px`;
        gridDiv.appendChild(line);
    }

    for (let x = 5; x < width; x += 5) {
        const line = document.createElement("div");
        line.classList.add("grid-line-v");
        line.style.left = `${x * cellSize + borderOffset}px`;
        gridDiv.appendChild(line);
    }
}

function initGrid(topClues = null, leftClues = null) {
    console.log("Initializing grid with clues:", { topClues, leftClues }); // Debug: Log clues
    const gridDiv = document.getElementById("grid");
    gridDiv.style.gridTemplateColumns = `repeat(${width}, 20px)`;
    gridDiv.innerHTML = "";
    gridDiv.style.pointerEvents = "auto";

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.addEventListener("contextmenu", e => e.preventDefault());
            gridDiv.appendChild(cell);
        }
    }

    addGridLines();
    updateClues(topClues, leftClues); // Pass decoded clues if available
    updateCells();
    updateSizeDisplay();
    updateHashPreview();
}

function updateCells() {
    const cells = document.querySelectorAll(".cell");
    cells.forEach(cell => {
        const x = +cell.dataset.x;
        const y = +cell.dataset.y;
        cell.classList.remove("active", "empty");
        if (grid[y][x] === 1) cell.classList.add("active");
        else if (grid[y][x] === 2) cell.classList.add("empty");
    });
}

function updateClues(topClues = null, leftClues = null) {
    console.log("Entering UpdateClues function"); // Debug: Log function entry
    const rowClues = document.getElementById("row-clues");
    const colClues = document.getElementById("col-clues");
    rowClues.innerHTML = "";
    colClues.innerHTML = "";

    let maxColClueHeight = 0;

    // Use provided topClues or calculate from the solution grid
    const columnClues = topClues || Array.from({ length: width }, (_, x) => getCounts(solution.map(row => row[x])));
    columnClues.forEach((counts, x) => {
        console.log(`Column ${x} clues:`, counts); // Debug: Log column clues
        const span = document.createElement("span");
        span.classList.add("clue-cell");
        if (counts.length) {
            counts.forEach(num => {
                console.log(`Adding column clue number ${num} to column ${x}`); // Debug: Log each clue number
                const numSpan = document.createElement("span");
                numSpan.classList.add("clue-number");
                numSpan.textContent = num;
                span.appendChild(numSpan);
            });
        } else {
            console.log(`Adding default column clue (0) to column ${x}`); // Debug: Log default clue
            const numSpan = document.createElement("span");
            numSpan.classList.add("clue-number");
            numSpan.textContent = "0";
            span.appendChild(numSpan);
        }
        colClues.appendChild(span);
        maxColClueHeight = Math.max(maxColClueHeight, counts.length || 1);
    });

    const clueHeight = 20;
    const colCluesHeight = maxColClueHeight * clueHeight + 2;
    rowClues.style.marginTop = `${colCluesHeight}px`;

    // Use provided leftClues or calculate from the solution grid
    const rowCluesData = leftClues || solution.map(row => getCounts(row));
    rowCluesData.forEach((counts, y) => {
        console.log(`Row ${y} clues:`, counts); // Debug: Log row clues
        const div = document.createElement("div");
        const clueSpan = document.createElement("span");
        clueSpan.classList.add("clue-cell");
        if (counts.length) {
            console.log(`Adding row clue numbers ${counts.join(", ")} to row ${y}`); // Debug: Log each clue number
            clueSpan.textContent = counts.join(" ");
        } else {
            console.log(`Adding default row clue (0) to row ${y}`); // Debug: Log default clue
            clueSpan.textContent = "0";
        }
        div.appendChild(clueSpan);
        rowClues.appendChild(div);
    });
}

function getCounts(arr) {
    const counts = [];
    let count = 0;
    for (let val of arr) {
        if (val === 1) count++;
        else if (count > 0) {
            counts.push(count);
            count = 0;
        }
    }
    if (count > 0) counts.push(count);
    return counts;
}

function updateHashPreview() {
    document.getElementById("hash-preview").value = window.location.hash || "";
}

function updateSizeDisplay() {
    document.getElementById("width-value").textContent = width;
    document.getElementById("height-value").textContent = height;
}

function decodeCluesOnly(base64) {
    console.log("Decoding clues-only URL:", base64); // Debug: Log the Base64 input

    const bytes = atob(base64).split('').map(c => c.charCodeAt(0));
    let bits = bytes.map(b => b.toString(2).padStart(8, '0')).join('');
    console.log("Decoded bit string:", bits); // Debug: Log the full bit string

    // Header
    const width = parseInt(bits.slice(0, 4), 2);
    const height = parseInt(bits.slice(4, 8), 2);
    const topCount = parseInt(bits.slice(8, 15), 2);
    const leftCount = parseInt(bits.slice(15, 22), 2);
    const dataBits = bits.slice(22);

    console.log("Header decoded:", { width, height, topCount, leftCount }); // Debug: Log header values

    if (width < 1 || width > 15 || height < 1 || height > 15) {
        throw new Error('Grid size out of range (1-15)');
    }

    const topClues = [];
    const leftClues = [];
    let currentGroup = [];
    let numberCount = 0;

    // Parse data
    for (let i = 0; i < dataBits.length; i += 5) {
        if (numberCount >= topCount + leftCount) break;

        const value = parseInt(dataBits.slice(i, i + 4), 2);
        const marker = dataBits[i + 4];

        currentGroup.push(value);
        numberCount++;

        console.log(`Parsed value: ${value}, marker: ${marker}, currentGroup:`, currentGroup); // Debug: Log parsed value and group

        if (marker === '1') {
            if (numberCount <= topCount) {
                topClues.push([...currentGroup]);
                console.log(`Added to topClues:`, currentGroup); // Debug: Log added group to topClues
            } else {
                leftClues.push([...currentGroup]);
                console.log(`Added to leftClues:`, currentGroup); // Debug: Log added group to leftClues
            }
            currentGroup = [];
        }
    }

    console.log("Final topClues:", topClues); // Debug: Log final topClues
    console.log("Final leftClues:", leftClues); // Debug: Log final leftClues

    if (topClues.length !== width || leftClues.length !== height) {
        console.error("Group count mismatch with header:", {
            expectedTopClues: width,
            actualTopClues: topClues.length,
            expectedLeftClues: height,
            actualLeftClues: leftClues.length
        }); // Debug: Log mismatch details
        throw new Error('Group count mismatch with header');
    }

    return { topClues, leftClues };
}

function decodeURL() {
    console.log("Decoding URL:", window.location.hash); // Debug: Log the full hash

    const hash = window.location.hash.slice(1);
    if (!hash) {
        console.log("No hash found in the URL."); // Debug: No hash present
        return;
    }

    if (hash.startsWith("clues:")) {
        console.log("Clues hash detected:", hash); // Debug: Clues hash detected
        const base64 = hash.slice(6);
        try {
            const { topClues, leftClues } = decodeCluesOnly(base64);
            console.log("Decoded clues:", { topClues, leftClues }); // Debug: Log decoded clues
            IFS=""
            puzzleId=""
            topClues.forEach((e,i,n) => { puzzleId+=IFS+e.at(-1); IFS="," })
            console.log(`puzzleId: ${puzzleId}`)
    
            // Display the puzzleId at the top of the page
            const puzzleIdDisplay = document.getElementById("puzzle-id-display");
            if (puzzleIdDisplay) {
                puzzleIdDisplay.textContent = `Puzzle ID: ${puzzleId}`;
            }
    
            // Reinitialize the grid based on the new clues
            width = topClues.length;
            height = leftClues.length;
            grid = Array(height).fill().map(() => Array(width).fill(0));
            solution = Array(height).fill().map(() => Array(width).fill(0)); // Empty solution grid
    
            // Initialize the grid and update the clues directly using the decoded data
            initGrid(topClues, leftClues);
        } catch (e) {
            console.error("Failed to decode clues-only URL:", e); // Debug: Error decoding clues
        }
        return;
    }

    console.log("Grid hash detected:", hash); // Debug: Grid hash detected
    const [size, data] = hash.split(":");
    const [w, h] = size.split("x").map(Number);
    if (w < 1 || w > 20 || h < 1 || h > 20) {
        console.error("Invalid grid size in hash:", { width: w, height: h }); // Debug: Invalid grid size
        return;
    }

    width = w;
    height = h;
    solution = Array(height).fill().map(() => Array(width).fill(0));
    grid = Array(height).fill().map(() => Array(width).fill(0)); // Initialize grid as empty
    let pos = 0;

    try {
        for (let i = 0; i < data.length && pos < w * h; i += 2) {
            const count = parseInt(data[i], 16);
            const value = parseInt(data[i + 1], 10);
            for (let j = 0; j < count && pos < w * h; j++) {
                const y = Math.floor(pos / width);
                const x = pos % width;
                solution[y][x] = value;
                pos++;
            }
        }
        console.log("Decoded grid solution:", solution); // Debug: Log decoded grid

        // Initialize the grid with the decoded solution
        initGrid();
    } catch (e) {
        console.error("Failed to decode grid hash:", e); // Debug: Error decoding grid
    }
}

document.getElementById("width-slider").addEventListener("input", e => {
    width = +e.target.value;
    if (document.getElementById("lock-ratio").checked) {
        height = width;
        document.getElementById("height-slider").value = height;
    }
    grid = Array(height).fill().map(() => Array(width).fill(0));
    solution = Array(height).fill().map(() => Array(width).fill(0));
    initGrid();
});

document.getElementById("height-slider").addEventListener("input", e => {
    height = +e.target.value;
    if (document.getElementById("lock-ratio").checked) {
        width = height;
        document.getElementById("width-slider").value = width;
    }
    grid = Array(height).fill().map(() => Array(width).fill(0));
    solution = Array(height).fill().map(() => Array(width).fill(0));
    initGrid();
});

document.getElementById("lock-ratio").addEventListener("change", e => {
    if (e.target.checked) {
        height = width;
        document.getElementById("height-slider").value = height;
        grid = Array(height).fill().map(() => Array(width).fill(0));
        solution = Array(height).fill().map(() => Array(width).fill(0));
        initGrid();
    }
});

function enableClueEditing(span, index, type) {
    const currentValue = span.textContent.trim();
    const input = document.createElement("input");
    input.type = "text";
    input.classList.add("clue-input");
    input.value = currentValue === "0" ? "" : currentValue;
    input.addEventListener("blur", () => {
        if (type === "row") {
            updateRowClue(index, input.value);
        } else {
            updateColClue(index, input.value);
        }
    });
    span.innerHTML = "";
    span.appendChild(input);
    input.focus();
}

// Startup
if (window.location.hash) {
    decodeURL();
} else {
    console.log("No URL fragment provided. Initializing default 5x5 grid."); // Debug: Log default grid initialization
    width = 5;
    height = 5;
    grid = Array(height).fill().map(() => Array(width).fill(0));
    solution = Array(height).fill().map(() => Array(width).fill(0));
    initGrid(); // Initialize the grid with default dimensions
}
document.getElementById("size-controls").classList.add("hidden");

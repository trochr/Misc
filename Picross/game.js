// /0qVcVLIYhRMGKQxQGwg3EGpA5DI4oiLMVayLI8jB2HJbhGGQxBkgP5hCOIQhiGQsw== (cutest thing ever)
// /zhg61qGo7jiQcRDiEdRxLEMQzjGsQyDQN61pQczhkgVwzhA (some vegetables)
// /zqNJDxUNBbuSRBCkYMR3kEkhB3mlp2FglDCiJVAjHMIhCkUtRCkEUxSjA== (aquarius)
// /07G4hHEJohGGQgyFIMgiiIUgjkEkURGKQz0kSIRCiEYZBEGIhCiIQYiGKIRRESIRhmaZ5DCGgQxDA== (air defence stuff)
// /2bBJhiEIYhCiIgxCSJAxCEMghDEIRBkEIohCGIQniIIZkqEURjDQIRRCEUQniGh4iiEMQhiEcShiEIYhCGIgig= (magnificient beast)
// /3jRSxGEMRhJEJAhiUJYiCEMQhCGQQhiEIQyCEMwliEYQxEEkRBDMk4hiGIghFEIgiDEKA1CEMQkikMhSOGIxhiE4QxCEIQ1LA== (it pinches)
// /0bzIiiMYYhCEkRiCKIRCiUcT1LilS4tSsgxGGIQhCGIQhCGIQhCGIghEGIQhJEIQjiEIQiiEIxxGeIURVuA (slimey stuff)
// #clues:/2Kox0IGQQhiMNRjiEQwyCWQQlkIshCDQQYjJIIQzKGY53iSgQikEQYiESJAhoWKA6DEoQxMKRQhiElY (heavy stuff)
// #clues:/1iZJCiENQhHMISBiEIajiQMRBDEIQxCGQQhkSYrUkGQphFIgoiiKwYkFMQYhDEIgyIEMQj3 (green prince) : unsolved
// #clues:/1jNpBFMIYmDUMQhEGIRiqEIYhCEMQjmHMQhCGId0iGQ5hCKRRhoMMQhEGQRBDEIQiDEIghoIMRhkMQZhFOA (whikers bubbles)
// #clues:/0yZbyCOIQjkEIohCOQQikEmIikEVAioSQ41FIIiSCEJJhCEUghFMIQ0CLF5BkGQaUlA (ace)
// #clues:/0BtbTJMcwikEkQlkSJYjJUchCiIVJUkKQqTnQNBVCKgTSCeZqDtWA== (slash)
// #clues:/2TIgxCEcQhCKJAhiIg4jGGxAxKGISCDIgwxESJ5BHEUSSDEIRxCEIoiCEMRDDEgh2IKJQxMIMhjDUkQmkEcQxJA (bites at night)
// #clues:/1SN4hFEIYhDmIohFIYQ2CEMQhDEI4hDEIQxCO04iqGIQhqGIQxCiIQhkEI6BDE0hYjS (big bill) unsolved
// #clues:/1LU7hiGophCKIwyCSJRyCEIZBCGRohJMQYhNacwhmIIZDFMIZjCKIQiFEQQjiEIYhEIMQhJEIolDEQQ0JA= (don't do them) unsovled
// #clues:/1DNYhiGIUyDEeAzCSYQyCOIxxCIMQhREQQzJM0giDMISRCMMRBiINAiiEIokCGIQxCGIRxGIMQhEGZo (cute and magic) 

let width = 15;
let height = 15;
let grid = Array(height).fill().map(() => Array(width).fill(0));
let solution = Array(height).fill().map(() => Array(width).fill(0));
let isEditMode = false;
let isHintMode = false; // New variable for hint capture mode
let isDragging = false;
let dragType = null;
let timeLeft = 1800;
let timerInterval = null;
let isDebugMode = false; // Debug mode is off by default

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!isEditMode) {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                gameOver();
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById("timer").textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function gameOver() {
    document.getElementById("message").textContent = "Game Over!";
    document.getElementById("message").classList.add("lost");
    document.getElementById("grid").style.pointerEvents = "none";
}

function applyPenalty() {
    timeLeft = Math.max(0, timeLeft - 300);
    updateTimerDisplay();
    if (timeLeft <= 0) gameOver();
}

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
            cell.addEventListener("mousedown", handleMouseDown);
            cell.addEventListener("mouseover", handleMouseOver);
            cell.addEventListener("contextmenu", e => e.preventDefault());
            gridDiv.appendChild(cell);
        }
    }

    document.addEventListener("mouseup", handleMouseUp);

    addGridLines();
    updateClues(topClues, leftClues); // Pass decoded clues if available
    updateCells();
    updateSizeDisplay();
    updateHashPreview();

    if (!isEditMode && !isHintMode) startTimer();
}

function setDefaultPattern() {
    width = 15;
    height = 15;
    solution = Array(height).fill().map(() => Array(width).fill(0));
    const defaultHash = "505180212051502120713021206120112b11011109110c1101110311031203130212031208120f111103110113011103130112011301120114011901140217021509130";
    let pos = 0;
    for (let i = 0; i < defaultHash.length && pos < width * height; i += 2) {
        const count = parseInt(defaultHash[i], 16);
        const value = parseInt(defaultHash[i + 1], 10);
        for (let j = 0; j < count && pos < width * height; j++) {
            const y = Math.floor(pos / width);
            const x = pos % width;
            solution[y][x] = value;
            pos++;
        }
    }
}

function handleMouseDown(e) {
    const x = +e.target.dataset.x;
    const y = +e.target.dataset.y;
    if (isEditMode && e.button === 0) {
        isDragging = true;
        dragType = "edit";
        grid[y][x] = grid[y][x] === 1 ? 0 : 1;
        solution = grid.map(row => [...row]);
        updateCells();
        updateClues();
        updateURL();
    } else if (isHintMode && e.button === 0) {
        isDragging = true;
        dragType = "hint";
        grid[y][x] = grid[y][x] === 1 ? 0 : 1;
        solution = grid.map(row => [...row]);
        updateCells();
        updateClues();
    } else if (!isEditMode && !isHintMode && timeLeft > 0) {
        isDragging = true;
        if (e.button === 0) {
            dragType = "left";
            grid[y][x] = grid[y][x] === 2 ? 0 : 2;
        } else if (e.button === 2) {
            dragType = "right";
            grid[y][x] = grid[y][x] === 1 ? 0 : 1;
            if (grid[y][x] === 1 && solution[y][x] === 0) applyPenalty();
        }
        updateCells();
        checkWin();
    }
}

function handleMouseOver(e) {
    if (!isDragging || timeLeft <= 0) return;
    const x = +e.target.dataset.x;
    const y = +e.target.dataset.y;
    if (dragType === "edit") {
        grid[y][x] = grid[y][x] === 1 ? 0 : 1;
        solution = grid.map(row => [...row]);
        updateCells();
        updateClues();
        updateURL();
    } else if (dragType === "hint") {
        grid[y][x] = grid[y][x] === 1 ? 0 : 1;
        solution = grid.map(row => [...row]);
        updateCells();
        updateClues();
    } else if (dragType === "left") {
        grid[y][x] = grid[y][x] === 2 ? 0 : 2;
        updateCells();
        checkWin();
    } else if (dragType === "right") {
        grid[y][x] = grid[y][x] === 1 ? 0 : 1;
        if (grid[y][x] === 1 && solution[y][x] === 0) applyPenalty();
        updateCells();
        checkWin();
    }
}

function handleMouseUp() {
    isDragging = false;
    dragType = null;
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

function updateRowClue(index, value) {
    const numbers = value.trim().split(" ").map(Number).filter(n => !isNaN(n) && n > 0);
    const span = document.createElement("span");
    span.classList.add("clue-cell");
    span.textContent = numbers.length ? numbers.join(" ") : "0";
    const rowDiv = document.querySelectorAll("#row-clues > div")[index];
    rowDiv.innerHTML = "";
    rowDiv.appendChild(span);
    updateSolutionFromClues();
}

function updateColClue(index, value) {
    const numbers = value.trim().split(" ").map(Number).filter(n => !isNaN(n) && n > 0);
    const span = document.createElement("span");
    span.classList.add("clue-cell");
    if (numbers.length) {
        numbers.forEach(num => {
            const numSpan = document.createElement("span");
            numSpan.classList.add("clue-number");
            numSpan.textContent = num;
            span.appendChild(numSpan);
        });
    } else {
        const numSpan = document.createElement("span");
        numSpan.classList.add("clue-number");
        numSpan.textContent = "0";
        span.appendChild(numSpan);
    }
    const colClue = document.querySelectorAll("#col-clues .clue-cell")[index];
    colClue.replaceWith(span);
    updateSolutionFromClues();
}

function updateSolutionFromClues() {
    const rowClues = getRowClues();
    const colClues = getColClues();
    solution = Array(height).fill().map(() => Array(width).fill(0));
    grid = solution.map(row => [...row]);
    updateCells();
    updateURL();
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

function checkWin() {
    const messageDiv = document.getElementById("message");
    messageDiv.textContent = "";
    messageDiv.classList.remove("lost");
    if (isEditMode || timeLeft <= 0) return;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (solution[y][x] === 1 && grid[y][x] !== 1) return;
            if (solution[y][x] === 0 && grid[y][x] === 1) return;
        }
    }
    messageDiv.textContent = "You Won!";
    clearInterval(timerInterval);
}

function updateURL() {
    if (!isEditMode || isHintMode) return;
    const binary = grid.flat().map(v => (v === 1 ? 1 : 0));
    let rle = "";
    let count = 1;
    let current = binary[0];
    for (let i = 1; i < binary.length; i++) {
        if (binary[i] === current && count < 15) {
            count++;
        } else {
            rle += count.toString(16) + current;
            count = 1;
            current = binary[i];
        }
    }
    rle += count.toString(16) + current;
    window.location.hash = `${width}x${height}:${rle}`;
    updateHashPreview();
}

function updateHashPreview() {
    document.getElementById("hash-preview").value = window.location.hash || "";
}

function updateSizeDisplay() {
    document.getElementById("width-value").textContent = width;
    document.getElementById("height-value").textContent = height;
}

function encodeCluesOnly(topClues, leftClues) {
    const width = topClues.length;
    const height = leftClues.length;

    // Count total numbers
    const topCount = topClues.reduce((sum, group) => sum + group.length, 0);
    const leftCount = leftClues.reduce((sum, group) => sum + group.length, 0);

    if (topCount > 127 || leftCount > 127) {
        throw new Error('Too many numbers in clues');
    }

    // Header: 4 bits width, 4 bits height, 7 bits topCount, 7 bits leftCount
    let bits = (width).toString(2).padStart(4, '0') +
               (height).toString(2).padStart(4, '0') +
               topCount.toString(2).padStart(7, '0') +
               leftCount.toString(2).padStart(7, '0');

    // Data: topClues
    topClues.forEach(group => {
        group.forEach((num, idx) => {
            if (num < 0 || num > 15) {
                throw new Error('Numbers in clues must be between 0 and 15');
            }
            bits += num.toString(2).padStart(4, '0') + (idx === group.length - 1 ? '1' : '0');
        });
    });

    // Data: leftClues
    leftClues.forEach(group => {
        group.forEach((num, idx) => {
            if (num < 0 || num > 15) {
                throw new Error('Numbers in clues must be between 0 and 15');
            }
            bits += num.toString(2).padStart(4, '0') + (idx === group.length - 1 ? '1' : '0');
        });
    });

    // Pad to byte boundary
    while (bits.length % 8 !== 0) bits += '0';
    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
        bytes.push(parseInt(bits.slice(i, i + 8), 2));
    }

    return btoa(String.fromCharCode(...bytes));
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

function setClues(topClues, leftClues) {
    console.log("Setting clues:", { topClues, leftClues });
    const rowCluesDiv = document.getElementById("row-clues");
    const colCluesDiv = document.getElementById("col-clues");
    rowCluesDiv.innerHTML = "";
    colCluesDiv.innerHTML = "";

    // Set column clues (topClues)
    topClues.forEach(clueGroup => {
        const span = document.createElement("span");
        span.classList.add("clue-cell");
        if (clueGroup.length) {
            clueGroup.forEach(num => {
                const numSpan = document.createElement("span");
                numSpan.classList.add("clue-number");
                numSpan.textContent = num;
                span.appendChild(numSpan);
            });
        } else {
            const numSpan = document.createElement("span");
            numSpan.classList.add("clue-number");
            numSpan.textContent = "0";
            span.appendChild(numSpan);
        }
        colCluesDiv.appendChild(span);
    });

    // Set row clues (leftClues)
    leftClues.forEach(clueGroup => {
        const div = document.createElement("div");
        const span = document.createElement("span");
        span.classList.add("clue-cell");
        span.textContent = clueGroup.length ? clueGroup.join(" ") : "0";
        div.appendChild(span);
        rowCluesDiv.appendChild(div);
    });
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

document.getElementById("reset-grid").addEventListener("click", () => {
    window.location.hash = "";
    width = 15;
    height = 15;
    document.getElementById("width-slider").value = 15;
    document.getElementById("height-slider").value = 15;
    isEditMode = false;
    document.getElementById("toggle-mode").textContent = "Switch to Edit Mode";
    document.getElementById("size-controls").classList.add("hidden");
    grid = Array(height).fill().map(() => Array(width).fill(0));
    solution = Array(height).fill().map(() => Array(width).fill(0));
    timeLeft = 1800;
    updateTimerDisplay();
    initGrid();
});

document.getElementById("toggle-mode").addEventListener("click", () => {
    isEditMode = !isEditMode;
    document.getElementById("toggle-mode").textContent = `Switch to ${isEditMode ? "Play" : "Edit"} Mode`;
    document.getElementById("size-controls").classList.toggle("hidden", !isEditMode);
    if (!isEditMode) {
        grid = Array(height).fill().map(() => Array(width).fill(0));
        timeLeft = 1800;
        updateTimerDisplay();
    } else {
        grid = solution.map(row => [...row]);
        if (timerInterval) clearInterval(timerInterval);
    }
    updateCells();
    updateClues();
    document.getElementById("message").textContent = "";
    document.getElementById("message").classList.remove("lost");
    updateHashPreview();
    if (!isEditMode) startTimer();
});

// Add event listener for the new button
document.getElementById("toggle-hint-mode").addEventListener("click", () => {
    isHintMode = !isHintMode;
    document.getElementById("toggle-hint-mode").textContent = `Switch to ${isHintMode ? "Play" : "Hint Capture"} Mode`;
    document.getElementById("size-controls").classList.toggle("hidden", !isHintMode);
    if (!isHintMode) {
        grid = Array(height).fill().map(() => Array(width).fill(0));
        timeLeft = 1800;
        updateTimerDisplay();
    } else {
        grid = solution.map(row => [...row]);
        if (timerInterval) clearInterval(timerInterval);
    }
    updateCells();
    updateClues();
    document.getElementById("message").textContent = "";
    document.getElementById("message").classList.remove("lost");
    updateHashPreview();
    if (!isHintMode) startTimer();
});

document.getElementById("generate-clues-url").addEventListener("click", generateCluesOnlyURL);

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

function generateCluesOnlyURL() {
    const rowClues = getRowClues();
    const colClues = getColClues();
    const base64 = encodeCluesOnly(colClues, rowClues);
    const url = `${window.location.origin}${window.location.pathname}#clues:${base64}`;
    navigator.clipboard.writeText(url).then(() => {
        alert("Clues-only URL copied to clipboard!");
    });
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

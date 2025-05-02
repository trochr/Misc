// Picross Solver Bot
// Initially coded by 4o but it was failing on some edge case that it didn't really figured out. Grok 3 did it better.

function getRowClues() {
    const rowCluesDiv = document.getElementById("row-clues");
    const rows = [];
    for (let i = 0; i < rowCluesDiv.children.length; i++) {
        const clueSpan = rowCluesDiv.children[i].querySelector(".clue-cell");
        const text = clueSpan.textContent.trim();
        if (text === "0") {
            rows.push([]);
        } else {
            rows.push(text.split(" ").map(Number));
        }
    }
    return rows;
}

function getColClues() {
    const colCluesDiv = document.getElementById("col-clues");
    const cols = [];
    for (let i = 0; i < colCluesDiv.children.length; i++) {
        const clueCell = colCluesDiv.children[i];
        const clueNumbers = Array.from(clueCell.querySelectorAll(".clue-number")).map(span => parseInt(span.textContent, 10));
        if (clueNumbers.length === 1 && clueNumbers[0] === 0) {
            cols.push([]);
        } else {
            cols.push(clueNumbers);
        }
    }
    return cols;
}



function generatePossibilities(N, clue) {
    const K = clue.length;
    if (K === 0) {
        const result = ["".padEnd(N, "0")];
        console.log(`Generated for N=${N}, clue=${JSON.stringify(clue)}: ${result.length} possibilities`);
        return result;
    }
    const totalFilled = clue.reduce((a, b) => a + b, 0);
    if (totalFilled > N) {
        console.log(`No possibilities for N=${N}, clue=${JSON.stringify(clue)}: totalFilled (${totalFilled}) > N`);
        return [];
    }
    const totalZeros = N - totalFilled;
    const mandatoryBetween = K - 1;
    if (totalZeros < mandatoryBetween) {
        console.log(`No possibilities for N=${N}, clue=${JSON.stringify(clue)}: totalZeros (${totalZeros}) < mandatoryBetween (${mandatoryBetween})`);
        return [];
    }
    const freeZeros = totalZeros - mandatoryBetween;
    const P = K + 1;
    const distributions = distribute(freeZeros, P);
    const possibilities = [];
    for (let dist of distributions) {
        let state = "";
        let currentPos = 0;
        state += "0".repeat(dist[0]);
        currentPos += dist[0];
        for (let i = 0; i < K; i++) {
            state += "1".repeat(clue[i]);
            currentPos += clue[i];
            let gap = (i < K - 1) ? 1 + dist[i + 1] : dist[i + 1];
            state += "0".repeat(gap);
            currentPos += gap;
        }
        if (currentPos === N) possibilities.push(state);
    }
    console.log(`Generated for N=${N}, clue=${JSON.stringify(clue)}: ${possibilities.length} possibilities${possibilities.length > 0 ? ` (e.g., ${possibilities[0]})` : ""}`);
    return possibilities;
}

function distribute(M, P) {
    const distributions = [];
    function recurse(remaining, current, index) {
        if (index === P) {
            if (remaining === 0) distributions.push(current.slice());
            return;
        }
        for (let i = 0; i <= remaining; i++) {
            current.push(i);
            recurse(remaining - i, current, index + 1);
            current.pop();
        }
    }
    recurse(M, [], 0);
    return distributions;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function checkSolution(cells, rowClues, colClues, width, height) {
    const grid = Array(height).fill().map(() => Array(width).fill(0));
    cells.forEach(cell => {
        const x = parseInt(cell.dataset.x, 10);
        const y = parseInt(cell.dataset.y, 10);
        if (cell.classList.contains("active")) grid[y][x] = 1;
    });

    for (let y = 0; y < height; y++) {
        const row = grid[y];
        const actualClue = [];
        let count = 0;
        for (let x = 0; x < width; x++) {
            if (row[x] === 1) {
                count++;
            } else if (count > 0) {
                actualClue.push(count);
                count = 0;
            }
        }
        if (count > 0) actualClue.push(count);
        if (actualClue.length === 0 && rowClues[y].length === 0) continue;
        if (JSON.stringify(actualClue) !== JSON.stringify(rowClues[y])) {
            console.log(`Row ${y} mismatch: expected ${JSON.stringify(rowClues[y])}, got ${JSON.stringify(actualClue)}`);
            return false;
        }
    }

    for (let x = 0; x < width; x++) {
        const col = grid.map(row => row[x]);
        const actualClue = [];
        let count = 0;
        for (let y = 0; y < height; y++) {
            if (col[y] === 1) {
                count++;
            } else if (count > 0) {
                actualClue.push(count);
                count = 0;
            }
        }
        if (count > 0) actualClue.push(count);
        if (actualClue.length === 0 && colClues[x].length === 0) continue;
        if (JSON.stringify(actualClue) !== JSON.stringify(colClues[x])) {
            console.log(`Col ${x} mismatch: expected ${JSON.stringify(colClues[x])}, got ${JSON.stringify(actualClue)}`);
            return false;
        }
    }
    return true;
}


// In your first script (solver)
function setCell(x, y, value) {
    const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    if (value === 1) {
        cell.classList.add("active");
        cell.classList.remove("empty");
        grid[y][x] = 1; // Sync grid
        console.log(`Set cell (${x}, ${y}) to filled`);
    } else if (value === 2) {
        cell.classList.add("empty");
        cell.classList.remove("active");
        grid[y][x] = 2; // Sync grid
        console.log(`Set cell (${x}, ${y}) to empty`);
    } else {
        cell.classList.remove("active", "empty");
        grid[y][x] = 0; // Sync grid
        console.log(`Cleared cell (${x}, ${y})`);
    }
}

async function solvePuzzle(rowClues, colClues, width, height) {
    console.log("Starting solver...");
    console.log("Row clues:", JSON.stringify(rowClues));
    console.log("Column clues:", JSON.stringify(colClues));
    console.log(`Dimensions: width=${width}, height=${height}`);

    // Sync grid with current DOM state
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
            if (cell.classList.contains("active")) {
                grid[y][x] = 1;
            } else if (cell.classList.contains("empty")) {
                grid[y][x] = 2;
            } else {
                grid[y][x] = 0;
            }
        }
    }
    console.log("Initial grid state:", grid.map(row => row.join("")).join("\n"));

    let rowPossibilities = rowClues.map((clue, i) => generatePossibilities(width, clue));
    let colPossibilities = colClues.map((clue, i) => generatePossibilities(height, clue));

    if (rowPossibilities.some(p => p.length === 0) || colPossibilities.some(p => p.length === 0)) {
        console.error("Some initial possibilities are empty - puzzle may be invalid.");
        return;
    }

    let changed;
    let iteration = 0;
    const messageDiv = document.getElementById("message");
    do {
        iteration++;
        messageDiv.textContent = `Solving: Iteration ${iteration}`;
        messageDiv.classList.remove("lost");
        console.log(`\nIteration ${iteration}:`);
        changed = false;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let rowPoss = rowPossibilities[y];
                let colPoss = colPossibilities[x];

                const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
                const isActive = cell.classList.contains("active");
                const isEmpty = cell.classList.contains("empty");
                const currentState = isActive ? "filled" : isEmpty ? "empty" : "unset";

                // Count filled cells in the row and column
                const filledInRow = grid[y].filter(v => v === 1).length;
                const filledInCol = grid.map(row => row[x]).filter(v => v === 1).length;

                // Get the total required filled cells from the clues
                const requiredInRow = rowClues[y].reduce((a, b) => a + b, 0);
                const requiredInCol = colClues[x].reduce((a, b) => a + b, 0);

                // Mark unset cells as empty if row or column is fully filled
                if (filledInRow === requiredInRow && currentState === "unset") {
                    setCell(x, y, 2);
                    changed = true;
                    console.log(`  Marking (${x}, ${y}) as empty because row ${y} is fully filled.`);
                    continue;
                }
                if (filledInCol === requiredInCol && currentState === "unset") {
                    setCell(x, y, 2);
                    changed = true;
                    console.log(`  Marking (${x}, ${y}) as empty because column ${x} is fully filled.`);
                    continue;
                }

                const rowAllOnes = rowPoss.every(p => p[x] === "1");
                const rowAllZeros = rowPoss.every(p => p[x] === "0");
                const rowValue = rowAllOnes ? 1 : rowAllZeros ? 0 : null;

                const colAllOnes = colPoss.every(p => p[y] === "1");
                const colAllZeros = colPoss.every(p => p[y] === "0");
                const colValue = colAllOnes ? 1 : colAllZeros ? 0 : null;

                if (rowValue === 1 && !isActive) {
                    setCell(x, y, 1);
                    changed = true;
                } else if (rowValue === 0 && !isEmpty) {
                    setCell(x, y, 2);
                    changed = true;
                } else if (colValue === 1 && !isActive) {
                    setCell(x, y, 1);
                    changed = true;
                } else if (colValue === 0 && !isEmpty) {
                    setCell(x, y, 2);
                    changed = true;
                } else if (rowValue !== null && colValue !== null && rowValue !== colValue) {
                    console.error(`Contradiction at (${x}, ${y}): rowValue=${rowValue}, colValue=${colValue}`);
                    messageDiv.textContent = `Solver failed at iteration ${iteration} - contradiction`;
                    return;
                }

                if (isActive) {
                    rowPossibilities[y] = rowPoss.filter(p => p[x] === "1");
                    colPossibilities[x] = colPoss.filter(p => p[y] === "1");
                } else if (isEmpty) {
                    rowPossibilities[y] = rowPoss.filter(p => p[x] === "0");
                    colPossibilities[x] = colPoss.filter(p => p[y] === "0");
                }

                if (rowPossibilities[y].length === 0 || colPossibilities[x].length === 0) {
                    console.error(`No valid possibilities left at (${x}, ${y})`);
                    messageDiv.textContent = `Solver failed at iteration ${iteration} - no possibilities`;
                    return;
                }
            }
        }

        if (changed) {
            await wait(1000);
        }
    } while (changed);

    const cells = Array.from(document.querySelectorAll(".cell")).filter(cell => {
        const x = parseInt(cell.dataset.x, 10);
        const y = parseInt(cell.dataset.y, 10);
        return x < width && y < height;
    });
    const isSolved = checkSolution(cells, rowClues, colClues, width, height);
    if (isSolved) {
        console.log("Puzzle solved!");
        messageDiv.textContent = `Puzzle solved in ${iteration} iterations!`;
        cells.forEach(cell => {
            if (!cell.classList.contains("active") && !cell.classList.contains("empty")) {
                const x = parseInt(cell.dataset.x, 10);
                const y = parseInt(cell.dataset.y, 10);
                setCell(x, y, 2);
            }
        });
    } else {
        console.log("Puzzle not fully solved - may require backtracking.");
        messageDiv.textContent = `Solver stopped at iteration ${iteration} - incomplete`;
    }
}

document.getElementById("solve-button").addEventListener("click", () => {
    const rowClues = getRowClues();
    const colClues = getColClues();
    const gridDiv = document.getElementById("grid");
    const cells = document.querySelectorAll(".cell").length;
    const height = document.getElementById("row-clues").children.length;
    const width = cells / height;
    console.log(`Grid dimensions: width=${width}, height=${height}, total cells=${cells}`);
    console.log(`Row clues length: ${rowClues.length}, Col clues length: ${colClues.length}`);
    solvePuzzle(rowClues, colClues, width, height);
});

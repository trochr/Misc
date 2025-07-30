// --- Flash unflooded tile state ---
let flashUnflooded = false;
let flashTimeoutId = null;
let lastUnfloodedTile = null;
// --- Win celebration state ---
let gameWon = false;
let winAnimId = null;

let tileSize = 50;
let strokeWidth = 8;
let strokeColor = '#870d0d';
let bgColor = '#590303';
let tiles = [];
let floodEnabled = true;

// Flood start position, fixed after first page load
let floodStartX = null;
let floodStartY = null;



function updateFloodedTilesCount(filledArr) {
    let floodedTiles = 0;
    let unfloodedTiles = [];
    for (const tile of tiles) {
        let flooded = false;
        for (let dy = 0; dy < tileSize; dy++) {
            for (let dx = 0; dx < tileSize; dx++) {
                const x = tile.x + dx;
                const y = tile.y + dy;
                if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                    const vIdx = y * canvas.width + x;
                    if (filledArr[vIdx]) {
                        flooded = true;
                        break;
                    }
                }
            }
            if (flooded) break;
        }
        if (flooded) floodedTiles++;
        else unfloodedTiles.push(tile);
    }
    floodedTilesDiv.textContent = `${floodedTiles} / ${tiles.length}`;
    // Track last unflooded tile for flashing
    if (unfloodedTiles.length === 1) {
        lastUnfloodedTile = unfloodedTiles[0];
    } else {
        lastUnfloodedTile = null;
    }
    if (floodedTiles === tiles.length && tiles.length > 0 && !gameWon) {
        celebrateWin();
    }
}

function celebrateWin() {
    gameWon = true;
    canvas.style.pointerEvents = 'none';
    let t = 0;
    let forward = true;
    const duration = 1200; // ms for one direction
    const fps = 60;
    const steps = Math.round(duration / (1000 / fps));
    function lerpColor(a, b, t) {
        // a, b: hex string '#rrggbb', t in [0,1]
        const ar = parseInt(a.slice(1,3),16), ag = parseInt(a.slice(3,5),16), ab = parseInt(a.slice(5,7),16);
        const br = parseInt(b.slice(1,3),16), bgc = parseInt(b.slice(3,5),16), bb = parseInt(b.slice(5,7),16);
        const r = Math.round(ar + (br-ar)*t);
        const g = Math.round(ag + (bgc-ag)*t);
        const b_ = Math.round(ab + (bb-ab)*t);
        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b_.toString(16).padStart(2,'0')}`;
    }
    function animate() {
        let tt = t/steps;
        if (!forward) tt = 1-tt;
        // Stroke color animates stroke->bg, bg animates bg->stroke (opposite direction)
        const colorStroke = lerpColor(strokeColor, bgColor, tt);
        const colorBg = lerpColor(bgColor, strokeColor, tt);
        floodedTilesDiv.style.setProperty('--flooded-tile-outline', colorStroke);
        floodedTilesDiv.style.setProperty('--flooded-tile-fill', colorBg);
        window._animStrokeColor = colorStroke;
        window._animBgColor = colorBg;
        draw();
        t++;
        if (t > steps) {
            t = 0;
            forward = !forward;
        }
        winAnimId = requestAnimationFrame(animate);
    }
    winAnimId = requestAnimationFrame(animate);
}

// Pixel-based flood fill
function floodFillPixel() {
    draw();
    // Use fixed start point
    const x0 = floodStartX;
    const y0 = floodStartY;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const bg = hexToRgb(bgColor);
    const fill = hexToRgb(strokeColor);
    const startIdx = (y0 * canvas.width + x0) * 4;
    // Only flood if starting on background
    if (!colorMatch(data, startIdx, bg)) return;
    const stack = [[x0, y0]];
    const filled = new Uint8Array(canvas.width * canvas.height);
    while (stack.length) {
        const [x, y] = stack.pop();
        if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) continue;
        const idx = (y * canvas.width + x) * 4;
        const vIdx = y * canvas.width + x;
        if (filled[vIdx]) continue;
        // Allow a small tolerance to reach antialiased arc edges
        if (!colorMatch(data, idx, bg, 40)) continue;
        setColor(data, idx, fill);
        filled[vIdx] = 1;
        stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
    }
    // Second and third pass: grow the fill by 2 pixels
    for (let pass = 0; pass < 1; pass++) {
        // Mark new pixels to fill in this pass
        const toFill = [];
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const vIdx = y * canvas.width + x;
                if (filled[vIdx]) continue;
                const idx = vIdx * 4;
                if (!colorMatch(data, idx, bg)) continue;
                // Check 4 neighbors for filled
                if (
                    (x > 0 && filled[vIdx - 1]) ||
                    (x < canvas.width - 1 && filled[vIdx + 1]) ||
                    (y > 0 && filled[vIdx - canvas.width]) ||
                    (y < canvas.height - 1 && filled[vIdx + canvas.width])
                ) {
                    toFill.push(vIdx);
                }
            }
        }
        // Fill and mark as filled
        for (const vIdx of toFill) {
            const idx = vIdx * 4;
            setColor(data, idx, fill);
            filled[vIdx] = 1;
        }
    }
    ctx.putImageData(imageData, 0, 0);
    updateFloodedTilesCount(filled);
}

// Helper: compare pixel color to [r,g,b]
// Helper: compare pixel color to [r,g,b] with tolerance
function colorMatch(data, idx, rgb, tol = 12) {
    return Math.abs(data[idx] - rgb[0]) <= tol &&
           Math.abs(data[idx+1] - rgb[1]) <= tol &&
           Math.abs(data[idx+2] - rgb[2]) <= tol;
}
// Helper: set pixel color
function setColor(data, idx, rgb) {
    data[idx] = rgb[0];
    data[idx+1] = rgb[1];
    data[idx+2] = rgb[2];
    data[idx+3] = 255;
}
// Helper: hex to [r,g,b]
function hexToRgb(hex) {
    hex = hex.replace('#','');
    return [parseInt(hex.substring(0,2),16), parseInt(hex.substring(2,4),16), parseInt(hex.substring(4,6),16)];
}

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Pick flood start position on page load
function pickFloodStart() {
    // Avoid edge tiles: pick a tile not on the outermost row/col
    const cols = Math.floor(window.innerWidth / tileSize);
    const rows = Math.floor(window.innerHeight / tileSize);
    if (cols <= 2 || rows <= 2) {
        // fallback: just pick anywhere
        floodStartX = Math.floor(Math.random() * window.innerWidth);
        floodStartY = Math.floor(Math.random() * window.innerHeight);
        return;
    }
    const col = 1 + Math.floor(Math.random() * (cols - 2));
    const row = 1 + Math.floor(Math.random() * (rows - 2));
    floodStartX = col * tileSize + Math.floor(tileSize / 2);
    floodStartY = row * tileSize + Math.floor(tileSize / 2);
}
pickFloodStart();



// Overlay for flooded tiles count (must be after strokeColor is defined)
let floodedTilesDiv = document.createElement('div');
floodedTilesDiv.className = 'flooded-tiles-counter';
floodedTilesDiv.style.setProperty('--flooded-tile-outline', strokeColor);
floodedTilesDiv.style.setProperty('--flooded-tile-fill', bgColor);
document.body.appendChild(floodedTilesDiv);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    generateTiles();
    // If puzzle starts with zero tiles, reload for a new puzzle
    if (tiles.length === 0) {
        window.location.reload();
        return;
    }
    draw();
}

function generateTiles() {
    tiles = [];
    const cols = Math.ceil(canvas.width / tileSize);
    const rows = Math.ceil(canvas.height / tileSize);
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            tiles.push({
                x: x * tileSize,
                y: y * tileSize,
                orientation: Math.random() < 0.5 ? 0 : 1
            });
        }
    }
}

function drawTile(tile) {
    ctx.save();
    ctx.translate(tile.x + tileSize / 2, tile.y + tileSize / 2);
    if (tile.orientation) {
        ctx.rotate(Math.PI / 2);
    }
    // Use animated color if in win state
    let drawStroke = strokeColor;
    if (window._animStrokeColor) drawStroke = window._animStrokeColor;
    ctx.strokeStyle = drawStroke;
    floodedTilesDiv.style.setProperty('--flooded-tile-outline', drawStroke);
    floodedTilesDiv.style.setProperty('--flooded-tile-fill', bgColor);
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Arc from top-left to bottom-right
    ctx.beginPath();
    ctx.arc(-tileSize / 2, -tileSize / 2, tileSize / 2, 0, Math.PI / 2);
    ctx.stroke();

    // Arc from bottom-right to top-left (opposite corner)
    ctx.beginPath();
    ctx.arc(tileSize / 2, tileSize / 2, tileSize / 2, Math.PI, 3 * Math.PI / 2);
    ctx.stroke();

    ctx.restore();
    // No highlight overlay here anymore
    // Helper to convert hex color to rgba
    function hexToRgba(hex, alpha) {
        hex = hex.replace('#', '');
        let r = parseInt(hex.substring(0,2), 16);
        let g = parseInt(hex.substring(2,4), 16);
        let b = parseInt(hex.substring(4,6), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Use animated background color if in win state
    let bg = bgColor;
    if (window._animBgColor) bg = window._animBgColor;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw arrow if flashing and there is a last unflooded tile (draw before tiles so it's always visible)
    if (flashUnflooded && lastUnfloodedTile) {
        // Arrow from center of canvas to center of tile
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const tx = lastUnfloodedTile.x + tileSize / 2;
        const ty = lastUnfloodedTile.y + tileSize / 2;
        const dx = tx - cx;
        const dy = ty - cy;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len > 10) {
            const arrowLen = Math.max(len - tileSize/2, 60);
            const arrowHead = 40;
            const arrowWidth = 22;
            // Arrow shaft
            ctx.save();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 14;
            ctx.globalAlpha = 1.0;
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + dx/len*arrowLen, cy + dy/len*arrowLen);
            ctx.stroke();
            // Arrow head
            const angle = Math.atan2(dy, dx);
            const hx = cx + dx/len*arrowLen;
            const hy = cy + dy/len*arrowLen;
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(hx - arrowHead*Math.cos(angle - Math.PI/7), hy - arrowHead*Math.sin(angle - Math.PI/7));
            ctx.lineTo(hx - arrowHead*Math.cos(angle + Math.PI/7), hy - arrowHead*Math.sin(angle + Math.PI/7));
            ctx.lineTo(hx, hy);
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 1.0;
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 10;
            ctx.fill();
            // Draw a circle at the target
            ctx.beginPath();
            ctx.arc(tx, ty, tileSize/2.2, 0, 2*Math.PI);
            ctx.lineWidth = 7;
            ctx.strokeStyle = '#fff200';
            ctx.globalAlpha = 0.85;
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.restore();
        }
    }

    tiles.forEach(tile => drawTile(tile));
}
// --- Flash unflooded tile on Shift press ---
window.addEventListener('keydown', (e) => {
    if (e.key === 'Shift' && !flashUnflooded && lastUnfloodedTile && !gameWon) {
        flashUnflooded = true;
        draw();
        if (flashTimeoutId) clearTimeout(flashTimeoutId);
        flashTimeoutId = setTimeout(() => {
            flashUnflooded = false;
            draw();
        }, 1000);
    }
});

function getTileAt(x, y) {
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);
    const index = row * Math.ceil(canvas.width / tileSize) + col;
    return tiles[index];
}

let lastHoveredCol = null;
let lastHoveredRow = null;
canvas.addEventListener('mousemove', (e) => {
    if (gameWon) return;
    const col = Math.floor(e.clientX / tileSize);
    const row = Math.floor(e.clientY / tileSize);
    if (col !== lastHoveredCol || row !== lastHoveredRow) {
        lastHoveredCol = col;
        lastHoveredRow = row;
        const tile = getTileAt(e.clientX, e.clientY);
        if (tile) {
            tile.orientation = 1 - tile.orientation;
            if (floodEnabled) {
                floodFillPixel();
            } else {
                draw();
            }
        }
    }
});

window.addEventListener('resize', resizeCanvas);

resizeCanvas();
// --- Allow click anywhere to restart after win ---
document.body.addEventListener('mousedown', (e) => {
    if (gameWon) {
        window.location.reload();
    }
});

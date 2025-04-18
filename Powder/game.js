// Main game loop, state management, and coordination
// Import modules and wire up the game
import { createPlayer, updatePlayerTurnAngle, handlePlayerJump, updatePlayerJump, updatePlayerPosition, updatePlayerScaleAndShadow } from './player.js';
import { createTree, createRock, obstacles, spawnObstacle, updateObstacles, resetObstacles } from './obstacles.js';
import { updateCarve, renderCarve, resetCarve } from './carve.js';
import { checkCollision, endGame, resetGame } from './gameState.js';
import { updateScoreDisplay, updateDebugPanel, showGameOverScreen, hideGameOverScreen, setupDebugPanel, setupDebugPanelToggle } from './ui.js';

const svg = document.getElementById('gameSvg');
const ns = "http://www.w3.org/2000/svg";
const gameOverScreen = document.getElementById('gameOver');
const scoreDisplay = document.getElementById('score');
const debugSpeed = document.getElementById('debugSpeed');
const debugAcceleration = document.getElementById('debugAcceleration');
const debugTurnAngle = document.getElementById('debugTurnAngle');

let player = null;
let speed = 2;
let straightAcceleration = 0.01;
let turnAcceleration = 0.0002;
let distance = 0;
let highScore = Number(localStorage.getItem('skiHighScore')) || 0;
let turnAngleRateIncrease = 2.5;
let turnAngleRateDecrease = 3.5;
let maxTurnAngle = 90;
let acceleration = 0;
let playerFragments = [];
let isCrashed = false;
let gameActive = true;
let allowReset = true;
let playerPx = 192.5; // Logical player x position

// Hide mouse cursor at game start if active
updateCursor();

// Mousemove handler to restore cursor
function handleMouseMoveOnce() {
    document.body.style.cursor = '';
    window.removeEventListener('mousemove', handleMouseMoveOnce);
}

// Listen for mousemove to restore cursor when hidden
document.addEventListener('mousemove', function mouseMoveHandler() {
    if (document.body.style.cursor === 'none') {
        handleMouseMoveOnce();
    }
});

// Playfield size variables
let playfieldWidth = 400;
let playfieldHeight = 600;

// Input handling and game state
const keys = {};

function doReset() {
    // Remove old player and create a new one, updating the global reference
    if (player && svg.contains(player)) svg.removeChild(player);
    player = createPlayer(svg, ns);
    // Ensure player is always the last child (on top for transforms/rotation)
    svg.appendChild(player);
    // Also update all references in modules that need the new player
    window._currentPlayer = player;
    // Reset player state for rotation effect
    player.angle = 0;
    player.turnAngle = 0;
    player.jumping = false;
    player.jumpHeight = 0;
    player.scale = 1;
    player.preJumpAngle = 0;
    playerPx = playfieldWidth / 2 - 7.5; // Center player
}

// Hide mouse cursor when game is active
function setCursorVisibility(visible) {
    // document.body.style.cursor = visible ? '' : 'none';
    document.body.style.cursor = 'none';
}

// Update cursor visibility when game state changes
function updateCursor() {
    setCursorVisibility(gameActive);
    if (gameActive) {
        // Hide cursor, re-enable mousemove listener
        window.addEventListener('mousemove', handleMouseMoveOnce);
    }
}

// Use e.key for layout independence
document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    keys[e.code] = true;
    // Fullscreen toggle with F key (layout independent)
    if (key === 'f') {
        const elem = document.documentElement;
        if (!document.fullscreenElement) {
            if (elem.requestFullscreen) elem.requestFullscreen();
            console.log('Entered fullscreen mode (F key pressed)');
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            console.log('Exited fullscreen mode (F key pressed)');
        }
    }
    // Wide mode toggle with W key (layout independent)
    if (key === 'w') {
        toggleWideMode();
    }
    // Pause toggle with P key (layout independent)
    if (key === 'p') {
        gameActive = !gameActive;
        updateCursor();
    }
    // Enter to reset (keep using code for Enter)
    if (e.code === 'Enter' && !gameActive && allowReset) {
        doReset();
        resetGame(svg, player, obstacles, [], [], [], { current: null }, { current: 0 }, gameOverScreen, playerFragments);
        hideGameOverScreen(gameOverScreen);
        gameActive = true;
        isCrashed = false;
        distance = 0;
        speed = 2;
        allowReset = false;
        updateCursor();
    }
});

document.addEventListener('keyup', e => {
    keys[e.code] = false;
    // Unlock jump only when jump key is released
    if ((e.code === 'Space' || e.code === 'ArrowUp') && player) {
        player.jumpLocked = false;
    }
});

// On initial load
player = createPlayer(svg, ns);

// Setup debug panel and input event listeners
const straightAccelInput = document.getElementById('straightAccel');
const turnAccelInput = document.getElementById('turnAccel');
const turnAngleRateIncreaseInput = document.getElementById('turnAngleRateIncrease');
const turnAngleRateDecreaseInput = document.getElementById('turnAngleRateDecrease');
const maxTurnAngleInput = document.getElementById('maxTurnAngle');
const resetHighScoreBtn = document.getElementById('resetHighScoreBtn');
const debugPanel = document.getElementById('debugPanel');
let isDebugPanelVisible = { value: false };

// Add a debug element for on-ground status
const debugOnGround = document.createElement('span');
debugOnGround.id = 'debugOnGround';
debugOnGround.style.marginLeft = '8px';
const debugOnGroundLabel = document.createElement('label');
debugOnGroundLabel.textContent = 'On Ground:';
debugOnGroundLabel.appendChild(debugOnGround);
debugPanel.appendChild(debugOnGroundLabel);

// Add debug element for px (player x position)
const debugPx = document.createElement('span');
debugPx.id = 'debugPx';
debugPx.style.marginLeft = '8px';
const debugPxLabel = document.createElement('label');
debugPxLabel.textContent = 'Player X:';
debugPxLabel.appendChild(debugPx);
debugPanel.appendChild(debugPxLabel);

// Add debug element for fullscreen status
const debugFullscreen = document.createElement('span');
debugFullscreen.id = 'debugFullscreen';
debugFullscreen.style.marginLeft = '8px';
const debugFullscreenLabel = document.createElement('label');
debugFullscreenLabel.textContent = 'Fullscreen:';
debugFullscreenLabel.appendChild(debugFullscreen);
debugPanel.appendChild(debugFullscreenLabel);

// Add debug element for wide mode status
const debugWideMode = document.createElement('span');
debugWideMode.id = 'debugWideMode';
debugWideMode.style.marginLeft = '8px';
const debugWideModeLabel = document.createElement('label');
debugWideModeLabel.textContent = 'Wide Mode:';
debugWideModeLabel.appendChild(debugWideMode);
debugPanel.appendChild(debugWideModeLabel);

// Example state update functions (replace with your actual state logic)
function updateStraightAcceleration(val) { /* ... */ }
function updateTurnAcceleration(val) { /* ... */ }
function updateTurnAngleRateIncrease(val) { /* ... */ }
function updateTurnAngleRateDecrease(val) { /* ... */ }
function updateMaxTurnAngle(val) { /* ... */ }
function resetHighScore() {
    highScore = 0;
    localStorage.setItem('skiHighScore', '0');
    // Update high score display in game over screen if visible
    let highScoreElem = gameOverScreen.querySelector('.game-over-highscore');
    if (highScoreElem) highScoreElem.textContent = `High Score: 0m`;
}

setupDebugPanel(
    straightAccelInput,
    turnAccelInput,
    turnAngleRateIncreaseInput,
    turnAngleRateDecreaseInput,
    maxTurnAngleInput,
    resetHighScoreBtn,
    updateStraightAcceleration,
    updateTurnAcceleration,
    updateTurnAngleRateIncrease,
    updateTurnAngleRateDecrease,
    updateMaxTurnAngle,
    resetHighScore
);

setupDebugPanelToggle((e) => {
    // ...existing key handling logic...
}, debugPanel, isDebugPanelVisible);

// Wide mode state
let isWideMode = false;
function toggleWideMode() {
    const gameContainer = document.getElementById('gameContainer');
    const svg = document.getElementById('gameSvg');
    if (!isWideMode) {
        playfieldWidth = window.innerWidth;
        playfieldHeight = window.innerHeight;
        gameContainer.style.position = 'fixed';
        gameContainer.style.top = '0';
        gameContainer.style.left = '0';
        gameContainer.style.width = playfieldWidth + 'px';
        gameContainer.style.height = playfieldHeight + 'px';
        gameContainer.style.background = '#fdf8f5';
        svg.setAttribute('width', playfieldWidth);
        svg.setAttribute('height', playfieldHeight);
        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';
        isWideMode = true;
        console.log('Entered wide mode (KeyW pressed)');
    } else {
        playfieldWidth = 400;
        playfieldHeight = 600;
        gameContainer.style.position = '';
        gameContainer.style.top = '';
        gameContainer.style.left = '';
        gameContainer.style.width = playfieldWidth + 'px';
        gameContainer.style.height = playfieldHeight + 'px';
        svg.setAttribute('width', playfieldWidth);
        svg.setAttribute('height', playfieldHeight);
        document.body.style.margin = '';
        document.body.style.overflow = '';
        isWideMode = false;
        console.log('Exited wide mode (KeyW pressed)');
    }
}

// Main game loop
function update() {
    if (!gameActive && !isCrashed) return;

    // --- Player turn/acceleration logic ---
    updatePlayerTurnAngle(player, keys, turnAngleRateIncrease, turnAngleRateDecrease, maxTurnAngle);
    handlePlayerJump(player, keys, gameActive);
    updatePlayerJump(player);
    let turnRatio = player.turnAngle / maxTurnAngle;
    // Always set jumpStartAngle at the exact moment the jump begins
    if (player.jumping && player.jumpHeight > 0 && player.jumpStartX === undefined) {
        player.jumpStartX = playerPx;
        player.jumpStartAngle = player.turnAngle || 0; // Always set to 0 if straight
        player.preJumpAngle = player.turnAngle || 0;
    }
    if (player.jumpHeight > 0) {
        // During jump, only apply turn movement if there was a turn angle at takeoff
        if (player.jumpStartAngle !== undefined && player.jumpStartAngle !== 0) {
            turnRatio = player.jumpStartAngle / maxTurnAngle;
            playerPx += turnRatio * 5;
        }
        // If jumpStartAngle is 0, do not change playerPx
    } else {
        // On ground, normal turn movement
        playerPx += turnRatio * 5;
        // When not jumping, clear jump lock
        if (player.jumpStartX !== undefined) delete player.jumpStartX;
        if (player.jumpStartAngle !== undefined) delete player.jumpStartAngle;
    }
    playerPx = Math.max(0, Math.min(playfieldWidth - 15 * player.scale, playerPx));
    updatePlayerScaleAndShadow(player, playerPx, player.scale, player.jumpHeight, svg);

    // Ensure player is above rocks when jumping
    if (player.jumpHeight > 0) {
        // Move player node to the end of the SVG so it renders above obstacles
        if (svg.lastChild !== player) {
            svg.appendChild(player);
        }
    } else {
        // Optionally, keep player at the end always, or re-insert before obstacles if needed
        // (No action needed if always at end)
    }

    // --- Acceleration and speed logic ---
    const absTurn = Math.abs(player.turnAngle);
    const turnPercent = absTurn / (0.9 * maxTurnAngle);
    if (turnPercent <= 0.5) {
        const accelFactor = Math.max(0, 1 - turnPercent);
        acceleration = straightAcceleration * accelFactor + turnAcceleration * (1 - accelFactor);
    } else {
        const negFactor = (turnPercent - 0.5) / 0.4;
        acceleration = -straightAcceleration * Math.min(1, Math.max(0, negFactor));
    }
    if (gameActive) {
        speed = Math.min(Math.max(speed + acceleration, 0), 10);
        distance += speed / 60;
    }

    // --- UI updates ---
    if (gameActive) {
        updateScoreDisplay(scoreDisplay, distance);
    } else {
        scoreDisplay.textContent = '';
    }
    updateDebugPanel(debugSpeed, debugAcceleration, debugTurnAngle, speed, acceleration, player.turnAngle);
    // Update On Ground debug flag
    const debugOnGround = document.getElementById('debugOnGround');
    if (debugOnGround) {
        debugOnGround.textContent = (player.jumpHeight === 0 && !player.jumping) ? 'true' : 'false';
    }
    // Update px in debug panel
    const debugPx = document.getElementById('debugPx');
    if (debugPx) {
        debugPx.textContent = playerPx.toFixed(2);
    }
    // Update fullscreen status in debug panel
    const debugFullscreen = document.getElementById('debugFullscreen');
    if (debugFullscreen) {
        debugFullscreen.textContent = document.fullscreenElement ? 'true' : 'false';
    }
    // Update wide mode status in debug panel
    const debugWideMode = document.getElementById('debugWideMode');
    if (debugWideMode) {
        debugWideMode.textContent = isWideMode ? 'true' : 'false';
    }

    // --- Obstacles ---
    updateObstacles(speed, svg, playfieldHeight);
    if (Math.random() < 0.02) spawnObstacle(svg, ns, gameActive, playfieldWidth, playfieldHeight);

    // --- Carve effect ---
    updateCarve(player, isCrashed, speed);
    renderCarve(svg, player);

    // --- Player fragments (explosion) ---
    if (isCrashed && playerFragments.length > 0) {
        for (let i = playerFragments.length - 1; i >= 0; --i) {
            const f = playerFragments[i];
            f.x += f.vx;
            f.y += f.vy;
            f.vx *= 0.95;
            f.vy *= 0.95;
            f.y -= speed;
            f.node.setAttribute('x', f.x);
            f.node.setAttribute('y', f.y);
            if (f.y < -20) {
                if (svg.contains(f.node)) svg.removeChild(f.node);
                playerFragments.splice(i, 1);
            }
        }
    }

    // --- Collision detection and end game ---
    if (!isCrashed && checkCollision(player, obstacles, isCrashed)) {
        let collidedType = 'tree';
        obstacles.forEach(ob => {
            const isRock = !ob.isTree;
            const playerY = parseFloat(player.getAttribute('y'));
            const playerBottom = playerY + 15 * player.scale;
            const obstacleTop = ob.y - (isRock ? 15 : 60);
            const jumpBuffer = 20;
            const inJump = player.jumping && isRock && playerBottom < (obstacleTop + jumpBuffer);
            const playerBox = player.getBoundingClientRect();
            const obBox = ob.getBoundingClientRect();
            const collision = playerBox.left < obBox.right && playerBox.right > obBox.left &&
                             playerBox.top < obBox.bottom && playerBox.bottom > obBox.top;
            if (!inJump && collision) {
                collidedType = isRock ? 'rock' : 'tree';
            }
        });
        endGameWrapper({
            player,
            keys,
            speed,
            svg,
            obstacles,
            playerFragmentsRef: { value: playerFragments },
            isCrashedRef: { value: isCrashed },
            distance: { value: distance },
            highScoreRef: { value: highScore },
            gameOverScreen,
            collidedType
        });
    }
}

function endGameWrapper(args) {
    endGame(args);
    gameActive = false;
    isCrashed = true;
    setTimeout(() => { allowReset = true; }, 1100);
    updateCursor();
}

setInterval(update, 1000 / 60);

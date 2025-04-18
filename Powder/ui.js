// UI and debug panel logic
export function updateScoreDisplay(scoreDisplay, distance) {
    scoreDisplay.style.position = 'absolute';
    scoreDisplay.style.right = '10px';
    scoreDisplay.style.bottom = '10px';
    scoreDisplay.style.left = '';
    scoreDisplay.style.top = '';
    scoreDisplay.style.fontStyle = 'italic';
    scoreDisplay.style.fontSize = '20px';
    scoreDisplay.style.color = '#9ba8c3';
    scoreDisplay.textContent = `${Math.floor(distance)}m`;
}

export function updateDebugPanel(debugSpeed, debugAcceleration, debugTurnAngle, speed, acceleration, turnAngle) {
    debugSpeed.textContent = speed.toFixed(4) + ' px/frame';
    debugAcceleration.textContent = acceleration.toFixed(4) + ' px/frame²';
    debugTurnAngle.textContent = turnAngle.toFixed(2) + '°';
}

export function showGameOverScreen(gameOverScreen, highScore) {
    let highScoreElem = gameOverScreen.querySelector('.game-over-highscore');
    if (!highScoreElem) {
        highScoreElem = document.createElement('div');
        highScoreElem.className = 'game-over-highscore';
        highScoreElem.style.fontStyle = 'italic';
        highScoreElem.style.marginTop = '16px';
        gameOverScreen.appendChild(highScoreElem);
    }
    highScoreElem.textContent = `High Score: ${Math.floor(highScore)}m`;
    gameOverScreen.style.display = 'block';
}

export function hideGameOverScreen(gameOverScreen) {
    gameOverScreen.style.display = 'none';
    const highScoreElem = gameOverScreen.querySelector('.game-over-highscore');
    if (highScoreElem) highScoreElem.textContent = '';
}

// Debug panel and input event listeners
export function setupDebugPanel(straightAccelInput, turnAccelInput, turnAngleRateIncreaseInput, turnAngleRateDecreaseInput, maxTurnAngleInput, resetHighScoreBtn, updateStraightAcceleration, updateTurnAcceleration, updateTurnAngleRateIncrease, updateTurnAngleRateDecrease, updateMaxTurnAngle, resetHighScore) {
    straightAccelInput.addEventListener('input', () => {
        const newValue = parseFloat(straightAccelInput.value);
        if (!isNaN(newValue) && newValue >= 0) updateStraightAcceleration(newValue);
    });
    turnAccelInput.addEventListener('input', () => {
        const newValue = parseFloat(turnAccelInput.value);
        if (!isNaN(newValue) && newValue >= 0) updateTurnAcceleration(newValue);
    });
    turnAngleRateIncreaseInput.addEventListener('input', () => {
        const v = parseFloat(turnAngleRateIncreaseInput.value);
        if (!isNaN(v) && v > 0) updateTurnAngleRateIncrease(v);
    });
    turnAngleRateDecreaseInput.addEventListener('input', () => {
        const v = parseFloat(turnAngleRateDecreaseInput.value);
        if (!isNaN(v) && v > 0) updateTurnAngleRateDecrease(v);
    });
    maxTurnAngleInput.addEventListener('input', () => {
        const v = parseFloat(maxTurnAngleInput.value);
        if (!isNaN(v) && v > 0) updateMaxTurnAngle(v);
    });
    resetHighScoreBtn.addEventListener('click', resetHighScore);
}

export function setupDebugPanelToggle(keyHandler, debugPanel, isDebugPanelVisibleRef) {
    document.addEventListener('keydown', e => {
        if (e.code === 'KeyD') {
            isDebugPanelVisibleRef.value = !isDebugPanelVisibleRef.value;
            debugPanel.style.display = isDebugPanelVisibleRef.value ? 'block' : 'none';
            console.log(`Debug panel ${isDebugPanelVisibleRef.value ? 'shown' : 'hidden'} (KeyD pressed)`);
        }
        keyHandler(e);
    });
    document.addEventListener('keyup', e => keyHandler(e));
}

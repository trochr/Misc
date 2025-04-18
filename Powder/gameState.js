export function checkCollision(player, obstacles, isCrashed) {
    if (isCrashed) return false;
    let collided = false;
    obstacles.forEach(ob => {
        const isRock = !ob.isTree;
        let playerBox = player.getBoundingClientRect();
        let obBox;
        if (isRock) {
            // For rocks, use the <rect> inside the group for collision
            const rect = ob.querySelector('rect');
            obBox = rect ? rect.getBoundingClientRect() : ob.getBoundingClientRect();
        } else {
            obBox = ob.getBoundingClientRect();
        }
        const playerY = parseFloat(player.getAttribute('y'));
        const playerBottom = playerY + 15 * player.scale;
        const obstacleTop = ob.y - (isRock ? 15 : 60);
        const jumpBuffer = 20;
        // Fix: For rocks, if player is jumping, always skip collision
        const inJump = player.jumping && isRock;
        const collision = playerBox.left < obBox.right && playerBox.right > obBox.left &&
                         playerBox.top < obBox.bottom && playerBox.bottom > obBox.top;
        if (!inJump && collision) {
            collided = true;
        }
    });
    return collided;
}

export function endGame({
    player, keys, speed, svg, obstacles, playerFragmentsRef, isCrashedRef, distance, highScoreRef, gameOverScreen, collidedType
}) {
    // Set game state
    isCrashedRef.value = true;
    player.style.display = 'none';
    // Explosion effect (player fragments)
    const px = parseFloat(player.getAttribute('x'));
    const py = parseFloat(player.getAttribute('y'));
    const psize = 15 * player.scale;
    let vx = 0;
    if (keys.ArrowLeft) vx = -3;
    else if (keys.ArrowRight) vx = 3;
    let vy = speed;
    function createFragment(x, y, size, color) {
        const frag = document.createElementNS(svg.namespaceURI, 'rect');
        frag.setAttribute('x', x);
        frag.setAttribute('y', y);
        frag.setAttribute('width', size);
        frag.setAttribute('height', size);
        frag.setAttribute('fill', color || '#7e90b2');
        frag.setAttribute('filter', 'url(#playerShadow)');
        // Insert debris behind all obstacles (before the first obstacle in the SVG)
        let inserted = false;
        for (let i = 0; i < svg.childNodes.length; ++i) {
            const node = svg.childNodes[i];
            if (obstacles.some(ob => ob === node)) {
                svg.insertBefore(frag, node);
                inserted = true;
                break;
            }
        }
        if (!inserted) svg.appendChild(frag);
        return frag;
    }
    // Create 4 fragments
    const fragments4 = [];
    const fragSize4 = psize / 2;
    for (let i = 0; i < 2; ++i) {
        for (let j = 0; j < 2; ++j) {
            const frag = createFragment(px + i * fragSize4, py + j * fragSize4, fragSize4);
            fragments4.push({
                node: frag,
                x: px + i * fragSize4,
                y: py + j * fragSize4,
                vx: vx + (Math.random() - 0.5) * 3,
                vy: vy + (Math.random() - 0.5) * 3
            });
        }
    }
    // Instantly split into 16 fragments (no pause)
    fragments4.forEach(f => svg.removeChild(f.node));
    const fragments16 = [];
    const fragSize16 = psize / 4;
    for (let i = 0; i < 2; ++i) {
        for (let j = 0; j < 2; ++j) {
            const base = fragments4[i * 2 + j];
            for (let k = 0; k < 2; ++k) {
                for (let l = 0; l < 2; ++l) {
                    const fx = base.x + k * fragSize16;
                    const fy = base.y + l * fragSize16;
                    const frag = createFragment(fx, fy, fragSize16);
                    fragments16.push({
                        node: frag,
                        x: fx,
                        y: fy,
                        vx: base.vx * 0.7 + (Math.random() - 0.5) * 2,
                        vy: base.vy * 0.7 + (Math.random() - 0.5) * 2
                    });
                }
            }
        }
    }
    playerFragmentsRef.value.length = 0;
    playerFragmentsRef.value.push(...fragments16);
    // High score logic
    const currentHighScore = Number(localStorage.getItem('skiHighScore')) || 0;
    if (distance.value > currentHighScore) {
        highScoreRef.value = distance.value;
        localStorage.setItem('skiHighScore', highScoreRef.value);
    } else {
        highScoreRef.value = currentHighScore;
    }
    let highScoreElem = gameOverScreen.querySelector('.game-over-highscore');
    if (!highScoreElem) {
        highScoreElem = document.createElement('div');
        highScoreElem.className = 'game-over-highscore';
        highScoreElem.style.fontStyle = 'italic';
        highScoreElem.style.marginTop = '16px';
        gameOverScreen.appendChild(highScoreElem);
    }
    highScoreElem.textContent = `High Score: ${Math.floor(highScoreRef.value)}m`;
    // Set custom crash message
    let crashMsgElem = gameOverScreen.querySelector('.game-over-crashmsg');
    if (!crashMsgElem) {
        crashMsgElem = document.createElement('div');
        crashMsgElem.className = 'game-over-crashmsg';
        crashMsgElem.style.marginTop = '8px';
        crashMsgElem.style.fontSize = '20px';
        gameOverScreen.insertBefore(crashMsgElem, highScoreElem);
    }
    crashMsgElem.textContent = `crashed into a ${collidedType} after ${Math.floor(distance.value)} meters`;
    setTimeout(() => {
        isCrashedRef.value = false;
        // Only show game over splash if the game is not active and the splash is not already visible
        if (!window._gameActive && gameOverScreen && gameOverScreen.style.display !== 'block') {
            gameOverScreen.style.display = 'block';
        }
    }, 1000);
}

export function resetGame(svg, player, obstacles, traces, carves, carveSegments, currentCarve, carveContinueTimer, gameOverScreen, playerFragments) {
    // Always hide the game over screen immediately on reset
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    svg.style.animationPlayState = 'running';
    player.setAttribute('display', 'inline');
    player.style.animation = 'none';
    player.offsetHeight; // trigger reflow
    player.style.animation = null;
    obstacles.forEach(ob => {
        ob.style.animationPlayState = 'running';
        ob.remove();
    });
    traces.forEach(trace => trace.remove());
    carves.forEach(carve => carve.remove());
    carveSegments.length = 0;
    currentCarve.current = null;
    clearTimeout(carveContinueTimer.current);
    // Remove all player fragment squares (debris)
    if (playerFragments && Array.isArray(playerFragments)) {
        for (let i = playerFragments.length - 1; i >= 0; --i) {
            const frag = playerFragments[i];
            if (frag && frag.node && svg.contains(frag.node)) {
                svg.removeChild(frag.node);
            }
        }
        playerFragments.length = 0;
    }
    // Always hide the game over screen immediately on reset
    gameOverScreen.style.display = 'none';
}
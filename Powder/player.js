// Player creation, movement, jump logic
export function createPlayer(svg, ns) {
    const player = document.createElementNS(ns, 'rect');
    player.setAttribute('x', 192.5);
    player.setAttribute('y', 100);
    player.setAttribute('width', 15);
    player.setAttribute('height', 15);
    player.setAttribute('fill', '#7e90b2');
    player.setAttribute('filter', 'url(#playerShadow)');
    player.style.display = '';
    svg.appendChild(player);
    player.angle = 0;
    player.jumping = false;
    player.jumpHeight = 0;
    player.scale = 1;
    player.preJumpAngle = 0;
    player.turnAngle = 0;
    player.jumpLocked = false;
    return player;
}

export function updatePlayerTurnAngle(player, keys, turnAngleRateIncrease, turnAngleRateDecrease, maxTurnAngle) {
    if (player.jumpHeight === 0) {
        if (keys.ArrowLeft && !keys.ArrowRight) {
            player.turnAngle = Math.max(player.turnAngle - turnAngleRateIncrease, -maxTurnAngle);
        } else if (keys.ArrowRight && !keys.ArrowLeft) {
            player.turnAngle = Math.min(player.turnAngle + turnAngleRateIncrease, maxTurnAngle);
        } else {
            if (player.turnAngle > 0) {
                player.turnAngle = Math.max(player.turnAngle - turnAngleRateDecrease, 0);
            } else if (player.turnAngle < 0) {
                player.turnAngle = Math.min(player.turnAngle + turnAngleRateDecrease, 0);
            }
        }
    }
    player.angle = player.turnAngle;
}

export function handlePlayerJump(player, keys, gameActive) {
    const isOnGround = player.jumpHeight === 0 && !player.jumping;
    // Only allow jump if on ground, not locked, and key was just pressed (not held)
    if ((keys.Space || keys.ArrowUp) && isOnGround && !player.jumpLocked && gameActive) {
        player.jumping = true;
        player.preJumpAngle = player.angle;
        player.jumpLocked = true;
    }
    // jumpLocked is only reset when the key is released (see game.js keyup handler)
}

export function updatePlayerJump(player) {
    if (player.jumping) {
        player.jumpHeight += 2.2; // doubled ascent rate
        if (player.jumpHeight >= 55) { // restored max height
            player.jumping = false;
        }
    } else if (player.jumpHeight > 0) {
        player.jumpHeight -= 2.2; // doubled descent rate
        if (player.jumpHeight < 0) player.jumpHeight = 0;
    }
}

export function updatePlayerPosition(player, px) {
    player.setAttribute('x', px);
    player.setAttribute('y', 100 - player.jumpHeight);
}

export function updatePlayerScaleAndShadow(player, px, playerScale, playerJumpHeight, svg) {
    // Scale player during jump
    const maxScale = 1.333;
    player.scale = 1 + (maxScale - 1) * (playerJumpHeight / 90);
    player.setAttribute('width', 15 * player.scale);
    player.setAttribute('height', 15 * player.scale);
    const centerX = px + (15 * player.scale) / 2;
    const centerY = parseFloat(player.getAttribute('y')) + (15 * player.scale) / 2;
    player.setAttribute('x', px - (15 * (player.scale - 1)) / 2);
    player.setAttribute('y', 100 - playerJumpHeight - (15 * (player.scale - 1)) / 2);

    // Update player shadow
    const shadowOffset = 2 + (playerJumpHeight / 90) * 4;
    const shadowBlur = 2 + (playerJumpHeight / 90) * 2;
    const playerShadowFilter = svg.querySelector('#playerShadow');
    playerShadowFilter.querySelector('feGaussianBlur').setAttribute('stdDeviation', shadowBlur);
    playerShadowFilter.querySelector('feOffset').setAttribute('dx', shadowOffset);
    playerShadowFilter.querySelector('feOffset').setAttribute('dy', shadowOffset);

    // Apply rotation: match the visual rotation exactly to the turn angle
    let visualAngle = player.angle;
    if (playerJumpHeight > 0) {
        visualAngle = player.preJumpAngle;
    }
    player.setAttribute('transform', `rotate(${visualAngle} ${centerX} ${centerY})`);
}

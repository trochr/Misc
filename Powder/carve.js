// Carve effect logic for modular use
let carveSegments = [];
let currentCarve = null;
let carveContinueTimer = 0;

export function updateCarve(player, isCrashed, speed) {
    const isCarvingNow = !isCrashed && Math.abs(player.turnAngle) > 45;
    if (isCarvingNow) {
        carveContinueTimer = 30;
    } else if (carveContinueTimer > 0) {
        carveContinueTimer--;
    }
    const isCarving = isCarvingNow || carveContinueTimer > 0;
    if (isCarving) {
        if (!currentCarve) {
            currentCarve = [];
            carveSegments.push(currentCarve);
            currentCarve._fadeInTimer = 30;
        }
        const carveX = parseFloat(player.getAttribute('x')) + (15 * player.scale) / 2;
        const carveY = parseFloat(player.getAttribute('y')) + (15 * player.scale) / 2;
        let color = '#888';
        if (currentCarve._fadeInTimer && currentCarve._fadeInTimer > 0) {
            const fadeRatio = 1 - currentCarve._fadeInTimer / 30;
            const grey = Math.round(255 - (255 - 136) * fadeRatio);
            color = `rgb(${grey},${grey},${grey})`;
            currentCarve._fadeInTimer--;
        } else if (!isCarvingNow && carveContinueTimer > 0) {
            const fadeRatio = 1 - carveContinueTimer / 30;
            const grey = Math.round(136 + (255 - 136) * fadeRatio);
            color = `rgb(${grey},${grey},${grey})`;
        }
        currentCarve.push({
            x: carveX,
            y: carveY,
            opacity: 0.5,
            color: color
        });
    } else if (currentCarve) {
        currentCarve = null;
    }
    // Move and fade segments
    for (let s = carveSegments.length - 1; s >= 0; --s) {
        const segment = carveSegments[s];
        for (let i = segment.length - 1; i >= 0; --i) {
            segment[i].y -= speed;
            segment[i].opacity *= 0.97;
            if (segment[i].opacity < 0.05 || segment[i].y < -10) {
                segment.splice(i, 1);
            }
        }
        if (segment.length === 0) carveSegments.splice(s, 1);
    }
}

export function renderCarve(svg, player) {
    svg.querySelectorAll('.carve-trace').forEach(node => svg.removeChild(node));
    for (let s = carveSegments.length - 1; s >= 0; --s) {
        const segment = carveSegments[s];
        for (let i = segment.length - 1; i >= 1; --i) {
            const curr = segment[i];
            const prev = segment[i - 1];
            const line = document.createElementNS(svg.namespaceURI, 'line');
            line.setAttribute('x1', curr.x);
            line.setAttribute('y1', curr.y);
            line.setAttribute('x2', prev.x);
            line.setAttribute('y2', prev.y);
            line.setAttribute('stroke', curr.color);
            line.setAttribute('stroke-width', '2');
            line.setAttribute('opacity', ((curr.opacity + prev.opacity) / 2).toFixed(2));
            line.setAttribute('class', 'carve-trace');
            svg.insertBefore(line, player);
        }
    }
}

export function resetCarve() {
    carveSegments = [];
    currentCarve = null;
    carveContinueTimer = 0;
}

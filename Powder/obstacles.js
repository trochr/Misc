// Obstacle creation, movement, and collision logic
// Use playfieldWidth and playfieldHeight from game.js
// (Assume they are globally available)
export function createTree(svg, ns, size, playfieldWidth, playfieldHeight) {
    const tree = document.createElementNS(ns, 'g');
    const x = Math.random() * (playfieldWidth - 40) + 20;
    const triangle1 = document.createElementNS(ns, 'polygon');
    const triangle2 = document.createElementNS(ns, 'polygon');
    const scale = size === 'small' ? 0.7 : 1;
    triangle1.setAttribute('points', `${x-20*scale},${playfieldHeight} ${x+20*scale},${playfieldHeight} ${x},${playfieldHeight-40*scale}`);
    triangle2.setAttribute('points', `${x-15*scale},${playfieldHeight-30*scale} ${x+15*scale},${playfieldHeight-30*scale} ${x},${playfieldHeight-60*scale}`);
    triangle1.setAttribute('fill', '#8bc5d3');
    triangle2.setAttribute('fill', '#8bc5d3');
    tree.appendChild(triangle1);
    tree.appendChild(triangle2);
    tree.y = playfieldHeight;
    tree.isTree = true;
    tree.setAttribute('filter', 'url(#shadow)');
    svg.appendChild(tree);
    return tree;
}

export function createRock(svg, ns, playfieldWidth, playfieldHeight) {
    const rock = document.createElementNS(ns, 'g');
    const x = Math.random() * (playfieldWidth - 30) + 15;
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x - 15);
    rect.setAttribute('y', playfieldHeight);
    rect.setAttribute('width', 30);
    rect.setAttribute('height', 15);
    rect.setAttribute('fill', '#8bc5d3');
    rock.appendChild(rect);
    rock.y = playfieldHeight;
    rock.isTree = false;
    rock.setAttribute('filter', 'url(#shadow)');
    svg.appendChild(rock);
    return rock;
}

// Obstacle management logic
export let obstacles = [];

export function spawnObstacle(svg, ns, gameActive, playfieldWidth, playfieldHeight) {
    if (!gameActive) return;
    const rand = Math.random();
    let obstacle;
    if (rand < 0.4) obstacle = createTree(svg, ns, 'large', playfieldWidth, playfieldHeight);
    else if (rand < 0.8) obstacle = createTree(svg, ns, 'small', playfieldWidth, playfieldHeight);
    else obstacle = createRock(svg, ns, playfieldWidth, playfieldHeight);
    obstacles.push(obstacle);
}

export function updateObstacles(speed, svg, playfieldHeight) {
    for (let i = obstacles.length - 1; i >= 0; --i) {
        const ob = obstacles[i];
        ob.y -= speed;
        ob.setAttribute('transform', `translate(0, ${-playfieldHeight + ob.y})`);
        if (ob.y < -60) {
            if (svg.contains(ob)) svg.removeChild(ob);
            obstacles.splice(i, 1);
        }
    }
}

export function resetObstacles(svg) {
    obstacles.forEach(ob => {
        if (svg.contains(ob)) svg.removeChild(ob);
    });
    obstacles.length = 0;
}
// ...add more obstacle-related exports as needed...

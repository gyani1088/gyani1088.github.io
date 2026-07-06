const canvas = document.getElementById('hanoiCanvas');
const ctx = canvas.getContext('2d');

let pegs = [[], [], []];
let moves = [];
let moveIndex = 0;
let numDisks = 0;

let animationFrameId = null;
let movingDisk = null; 
let nextMoveTimestamp = 0;
const phaseDuration = 250; 
const postMoveDelay = 150; 

let pegX = [];
let baseY = 0;
let maxDiskWidth = 0;
const minDiskWidth = 30;
let diskHeight = 0;

const diskColors = [
    "#4CAF50", "#2196F3", "#FF9800", "#9C27B0", 
    "#F44336", "#3F51B5", "#00BCD4", "#8BC34A"
];

function initHanoi() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    let inputVal = parseInt(document.getElementById('diskCount').value, 10);
    numDisks = Math.max(3, Math.min(8, inputVal || 3));
    document.getElementById('diskCount').value = numDisks;

    const w = canvas.width;
    const h = canvas.height;
    baseY = h - 40;
    pegX = [w / 6, w / 2, w * 5 / 6];
    maxDiskWidth = w / 5;
    diskHeight = Math.max(16, (baseY - (baseY - 200)) / Math.max(6, numDisks));

    pegs = [[], [], []];
    for (let size = numDisks; size >= 1; size--) {
        pegs[0].push(size);
    }

    moves = [];
    moveIndex = 0;
    generateMoves(numDisks, 0, 2, 1);

    movingDisk = null;
    nextMoveTimestamp = performance.now() + 300; 

    requestAnimationFrame(animationLoop);
}

function generateMoves(n, from, to, aux) {
    if (n === 0) return;
    generateMoves(n - 1, from, aux, to);
    moves.push({ disk: n, from: from, to: to });
    generateMoves(n - 1, aux, to, from);
}

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function animationLoop(timestamp) {
    updateAnimation(timestamp);
    drawPanel();
    animationFrameId = requestAnimationFrame(animationLoop);
}

function updateAnimation(timestamp) {
    if (timestamp < nextMoveTimestamp) return;

    if (movingDisk === null) {
        if (moveIndex >= moves.length) return; 

        const m = moves[moveIndex];
        if (pegs[m.from].length > 0) {
            const size = pegs[m.from].pop(); 

            const startX = pegX[m.from];
            const startY = baseY - (pegs[m.from].length + 1) * diskHeight;
            const targetX = pegX[m.to];
            const targetY = baseY - (pegs[m.to].length + 1) * diskHeight;
            const clearanceY = baseY - 230; 

            movingDisk = {
                size: size,
                x: startX,
                y: startY,
                startX: startX,
                startY: startY,
                targetX: targetX,
                targetY: targetY,
                clearanceY: clearanceY,
                phase: 'UP', 
                phaseStartTime: timestamp
            };
        }
    } else {
        let elapsed = timestamp - movingDisk.phaseStartTime;
        let t = Math.min(elapsed / phaseDuration, 1);
        let easedT = easeInOutQuad(t);

        switch (movingDisk.phase) {
            case 'UP':
                movingDisk.y = movingDisk.startY + (movingDisk.clearanceY - movingDisk.startY) * easedT;
                if (t === 1) {
                    movingDisk.phase = 'ACROSS';
                    movingDisk.phaseStartTime = timestamp;
                }
                break;
            case 'ACROSS':
                movingDisk.x = movingDisk.startX + (movingDisk.targetX - movingDisk.startX) * easedT;
                if (t === 1) {
                    movingDisk.phase = 'DOWN';
                    movingDisk.phaseStartTime = timestamp;
                }
                break;
            case 'DOWN':
                movingDisk.y = movingDisk.clearanceY + (movingDisk.targetY - movingDisk.clearanceY) * easedT;
                if (t === 1) {
                    pegs[moves[moveIndex].to].push(movingDisk.size);
                    movingDisk = null;
                    moveIndex++;
                    nextMoveTimestamp = timestamp + postMoveDelay; 
                }
                break;
        }
    }
}

function drawSingleDisk(diskSize, centerX, centerY) {
    const widthDisk = minDiskWidth + (diskSize - 1) * ((maxDiskWidth - minDiskWidth) / Math.max(1, numDisks - 1));
    const x = centerX - widthDisk / 2;

    ctx.fillStyle = diskColors[(diskSize - 1) % diskColors.length];
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;

    roundRect(ctx, x, centerY, widthDisk, diskHeight - 2, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(diskSize.toString(), centerX, centerY + (diskHeight - 2) / 2);
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function drawPanel() {
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, w, h);

    const pegWidth = 8;

    ctx.fillStyle = "darkgray";
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(pegX[i] - w / 12, baseY + 10, w / 6, 8); 
        ctx.fillRect(pegX[i] - pegWidth / 2, baseY - 200, pegWidth, 200); 
    }

    for (let i = 0; i < 3; i++) {
        const stack = pegs[i];
        for (let depth = 0; depth < stack.length; depth++) {
            const diskSize = stack[depth];
            const centerY = baseY - (depth + 1) * diskHeight;
            drawSingleDisk(diskSize, pegX[i], centerY);
        }
    }

    if (movingDisk !== null) {
        drawSingleDisk(movingDisk.size, movingDisk.x, movingDisk.y);
    }
}

// Initial draw state
const w = canvas.width;
const h = canvas.height;
baseY = h - 40;
pegX = [w / 6, w / 2, w * 5 / 6];
maxDiskWidth = w / 5;
diskHeight = Math.max(16, (baseY - (baseY - 200)) / 6);
drawPanel();

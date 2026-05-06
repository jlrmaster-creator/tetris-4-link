const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextPieceCanvas');
const nextCtx = nextCanvas.getContext('2d');

const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const levelEl = document.getElementById('level');
const startBtn = document.getElementById('startBtn');
const holdBtn = document.getElementById('holdBtn');
const pauseBtn = document.getElementById('pauseBtn');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen = document.getElementById('pauseScreen');
const finalScoreEl = document.getElementById('finalScore');

// Touch Controls
const btnUp = document.getElementById('btnUp');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnDrop = document.getElementById('btnDrop');
const btnHold = document.getElementById('btnHold');
const btnMobilePause = document.getElementById('btnMobilePause');

// Mobile Tabs
const tabPlay = document.getElementById('tabPlay');
const tabInfo = document.getElementById('tabInfo');
const gameContainer = document.getElementById('gameContainer');
const mobileInfoPanel = document.getElementById('mobileInfoPanel');
const touchControls = document.getElementById('touchControls');

// --- Sound Engine ---
let audioCtx;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playArcadeSound(type) {
    initAudio();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'start') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'levelUp') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.setValueAtTime(400, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);
        osc.start(); osc.stop(audioCtx.currentTime + 0.6);
    } else if (type === 'clear') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'bomb') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.8);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        osc.start(); osc.stop(audioCtx.currentTime + 0.8);
    } else if (type === 'connect4') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.2);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    }
}

function speak(text, pitch = 1.5, rate = 1.2) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = pitch; 
        utterance.rate = rate;
        utterance.lang = 'es-ES';
        window.speechSynthesis.speak(utterance);
    }
}

function playSoundEvent(type) {
    playArcadeSound(type);
    if (type === 'start') speak("¡A jugar!");
    else if (type === 'levelUp') speak("¡Súper nivel!");
    else if (type === 'clear') speak("¡Línea!");
    else if (type === 'connect4') speak("¡Toma ya, 4 en raya!");
    else if (type === 'bomb') speak("¡Bum bomba!");
    else if (type === 'gameover') speak("¡Oh no, perdiste!");
}

// Constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // internal size, CSS scales it

// Vibrante Colors
const COLORS = [
    'rgb(255, 50, 50)',   // Red
    'rgb(50, 255, 50)',   // Green
    'rgb(50, 150, 255)',  // Blue
    'rgb(255, 255, 50)',  // Yellow
    'rgb(255, 50, 255)'   // Magenta
];

const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 0, 0], [1, 1, 1]], // L
    [[0, 0, 1], [1, 1, 1]], // J
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 0], [0, 1, 1]]  // Z
];

const POWERUPS = ['B', 'A', 'M']; // Bomb, Rainbow, Hammer

class Block {
    constructor(color, powerup = null) {
        this.color = color;
        this.originalColor = color;
        this.powerup = powerup;
        this.isBlocked = false;
        this.blockedTurns = 0;
    }
}

class Piece {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        const shapeType = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        
        this.blocks = [];
        const isPieceBlocked = Math.random() < 0.1; // 10% chance
        
        for (let r = 0; r < shapeType.length; r++) {
            let row = [];
            for (let c = 0; c < shapeType[r].length; c++) {
                if (shapeType[r][c]) {
                    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
                    let powerup = null;
                    if (Math.random() < 0.03) {
                        powerup = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
                    }
                    let block = new Block(color, powerup);
                    if (isPieceBlocked) {
                        block.isBlocked = true;
                        block.blockedTurns = 4; // Stays blocked for 4 locks
                        block.color = '#777';
                    }
                    row.push(block);
                } else {
                    row.push(null);
                }
            }
            this.blocks.push(row);
        }
    }

    rotate() {
        // Transpose and reverse
        const newBlocks = [];
        for (let c = 0; c < this.blocks[0].length; c++) {
            let newRow = [];
            for (let r = this.blocks.length - 1; r >= 0; r--) {
                newRow.push(this.blocks[r][c]);
            }
            newBlocks.push(newRow);
        }
        this.blocks = newBlocks;
    }
}

class Board {
    constructor() {
        this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        this.highlightedRows = []; // For line clear effect
        this.highlightedBlocks = []; // For Connect 4 effect
    }

    isValidPos(piece, offsetX = 0, offsetY = 0) {
        for (let y = 0; y < piece.blocks.length; y++) {
            for (let x = 0; x < piece.blocks[y].length; x++) {
                if (piece.blocks[y][x]) {
                    let newX = piece.x + x + offsetX;
                    let newY = piece.y + y + offsetY;
                    
                    if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
                    if (newY >= 0 && this.grid[newY][newX]) return false;
                }
            }
        }
        return true;
    }

    lockPiece(piece) {
        let overflow = false;
        for (let y = 0; y < piece.blocks.length; y++) {
            for (let x = 0; x < piece.blocks[y].length; x++) {
                if (piece.blocks[y][x]) {
                    let newY = piece.y + y;
                    let newX = piece.x + x;
                    if (newY >= 0) {
                        this.grid[newY][newX] = piece.blocks[y][x];
                    } else {
                        overflow = true;
                    }
                }
            }
        }
        return overflow;
    }

    checkPowerupsLanding(piece) {
        let destroyPositions = new Set();
        for (let y = 0; y < piece.blocks.length; y++) {
            for (let x = 0; x < piece.blocks[y].length; x++) {
                let block = piece.blocks[y][x];
                if (block) {
                    let py = piece.y + y;
                    let px = piece.x + x;
                    if (py >= 0 && px >= 0 && px < COLS) {
                        if (block.powerup === 'B') {
                            for (let dy = -1; dy <= 1; dy++) {
                                for (let dx = -1; dx <= 1; dx++) {
                                    if (py+dy >= 0 && py+dy < ROWS && px+dx >= 0 && px+dx < COLS) {
                                        destroyPositions.add(`${px+dx},${py+dy}`);
                                    }
                                }
                            }
                        } else if (block.powerup === 'M') {
                            for (let c = 0; c < COLS; c++) destroyPositions.add(`${c},${py}`);
                            for (let r = 0; r < ROWS; r++) destroyPositions.add(`${px},${r}`);
                        }
                    }
                }
            }
        }

        let points = 0;
        if (destroyPositions.size > 0) {
            destroyPositions.forEach(pos => {
                let [px, py] = pos.split(',').map(Number);
                if (this.grid[py][px]) {
                    this.grid[py][px] = null;
                    points += 20;
                }
            });
            return { points, triggered: true };
        }
        return { points: 0, triggered: false };
    }

    clearLines() {
        let linesToClear = [];
        for (let y = ROWS - 1; y >= 0; y--) {
            let isFull = true;
            let hasBlocked = false;
            for (let x = 0; x < COLS; x++) {
                if (!this.grid[y][x]) {
                    isFull = false;
                    break;
                }
                if (this.grid[y][x].isBlocked) hasBlocked = true;
            }
            if (isFull && !hasBlocked) linesToClear.push(y);
        }
        return linesToClear;
    }

    removeLines(lines) {
        lines.sort((a,b) => a-b).forEach(y => {
            this.grid.splice(y, 1);
            this.grid.unshift(Array(COLS).fill(null));
        });
    }

    checkConnect4() {
        let toRemove = new Set();
        
        const isMatch = (c1, c2) => {
            if (!c1 || !c2) return false;
            if (c1.powerup === 'A' || c2.powerup === 'A') return true;
            return c1.color === c2.color;
        };

        const directions = [[1,0], [0,1], [1,1], [1,-1]];
        
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.grid[y][x] && !this.grid[y][x].isBlocked) {
                    const color = this.grid[y][x].color;
                    
                    // 1. Line Detection (H, V, D1, D2)
                    for (let [dx, dy] of directions) {
                        let matchCoords = [[x, y]];
                        let currX = x + dx;
                        let currY = y + dy;
                        
                        while (currX >= 0 && currX < COLS && currY >= 0 && currY < ROWS) {
                            let prevCell = this.grid[matchCoords[matchCoords.length-1][1]][matchCoords[matchCoords.length-1][0]];
                            let currCell = this.grid[currY][currX];
                            
                            if (isMatch(prevCell, currCell) && !currCell.isBlocked) {
                                matchCoords.push([currX, currY]);
                                currX += dx;
                                currY += dy;
                            } else {
                                break;
                            }
                        }
                        
                        if (matchCoords.length >= 4) {
                            matchCoords.forEach(coord => toRemove.add(`${coord[0]},${coord[1]}`));
                        }
                    }

                    // 2. Square Detection (2x2)
                    if (x < COLS - 1 && y < ROWS - 1) {
                        let p1 = this.grid[y][x];
                        let p2 = this.grid[y][x+1];
                        let p3 = this.grid[y+1][x];
                        let p4 = this.grid[y+1][x+1];
                        if (p1 && p2 && p3 && p4 && !p2.isBlocked && !p3.isBlocked && !p4.isBlocked) {
                            if (isMatch(p1, p2) && isMatch(p1, p3) && isMatch(p1, p4)) {
                                toRemove.add(`${x},${y}`);
                                toRemove.add(`${x+1},${y}`);
                                toRemove.add(`${x},${y+1}`);
                                toRemove.add(`${x+1},${y+1}`);
                            }
                        }
                    }
                }
            }
        }

        let points = toRemove.size * 100;
        let coords = Array.from(toRemove).map(pos => pos.split(',').map(Number));
        return { points, triggered: toRemove.size > 0, coords };
    }

    removeBlocks(coords) {
        coords.forEach(([px, py]) => {
            this.grid[py][px] = null;
        });
    }

    applyCascadeGravity() {
        let movedAny = false;
        for (let x = 0; x < COLS; x++) {
            for (let y = ROWS - 2; y >= 0; y--) {
                if (this.grid[y][x]) {
                    let currY = y;
                    while (currY < ROWS - 1 && !this.grid[currY + 1][x]) {
                        this.grid[currY + 1][x] = this.grid[currY][x];
                        this.grid[currY][x] = null;
                        currY++;
                        movedAny = true;
                    }
                }
            }
        }
        return movedAny;
    }
}

// Game State
let board = new Board();
let currentPiece = null;
let nextPiece = null;
let heldPiece = null;
let canHold = true;
let score = 0;
let comboCount = 0;
let pieceCount = 0;
let level = 1;
let reached1000 = false;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameOver = false;
let isPaused = false;
let isAnimating = false; // pause inputs during cascade
let animationQueue = [];
let reqId;

function drawBlock(ctx, x, y, block) {
    if (!block) return;
    
    // Base Color
    ctx.fillStyle = block.color;
    
    // Highlight effect if in highlightedBlocks
    const isHighlighted = board.highlightedBlocks.some(c => c[0] === x && c[1] === y);
    if (isHighlighted) {
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 15;
    }

    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.shadowBlur = 0; // reset
    
    // Inner Shadow/Highlight for 3D effect
    if (!isHighlighted) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE / 4); // top light
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + (BLOCK_SIZE * 0.75), BLOCK_SIZE, BLOCK_SIZE / 4); // bottom shadow
    }
    
    // Border
    ctx.strokeStyle = isHighlighted ? '#fff' : '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    
    // Powerup Text
    if (block.powerup) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Shadow for text
        ctx.shadowColor = 'black';
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 2;
        
        ctx.fillText(block.powerup, (x + 0.5) * BLOCK_SIZE, (y + 0.5) * BLOCK_SIZE);
        
        ctx.shadowColor = 'transparent'; // reset
    }
}

function drawGrid(ctx, width, height) {
    ctx.strokeStyle = '#282832';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += BLOCK_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y <= height; y += BLOCK_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

function draw() {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height);

    // Draw Board
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            drawBlock(ctx, x, y, board.grid[y][x]);
        }
    }

    // Draw Highlights
    ctx.save();
    board.highlightedRows.forEach(y => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(0, y * BLOCK_SIZE, canvas.width, BLOCK_SIZE);
    });
    board.highlightedBlocks.forEach(([x, y]) => {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    });
    ctx.restore();

    // Draw Current Piece
    if (currentPiece) {
        for (let y = 0; y < currentPiece.blocks.length; y++) {
            for (let x = 0; x < currentPiece.blocks[y].length; x++) {
                if (currentPiece.blocks[y][x] && currentPiece.y + y >= 0) {
                    drawBlock(ctx, currentPiece.x + x, currentPiece.y + y, currentPiece.blocks[y][x]);
                }
            }
        }
    }

    // Draw Next Piece
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece) {
        const offsetX = (nextCanvas.width / BLOCK_SIZE - nextPiece.blocks[0].length) / 2;
        const offsetY = (nextCanvas.height / BLOCK_SIZE - nextPiece.blocks.length) / 2;
        for (let y = 0; y < nextPiece.blocks.length; y++) {
            for (let x = 0; x < nextPiece.blocks[y].length; x++) {
                if (nextPiece.blocks[y][x]) {
                    drawBlock(nextCtx, offsetX + x, offsetY + y, nextPiece.blocks[y][x]);
                }
            }
        }
    }

    // Draw Held Piece on Board (Frozen/Waiting)
    if (heldPiece) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        for (let y = 0; y < heldPiece.blocks.length; y++) {
            for (let x = 0; x < heldPiece.blocks[y].length; x++) {
                if (heldPiece.blocks[y][x] && heldPiece.y + y >= 0) {
                    drawBlock(ctx, heldPiece.x + x, heldPiece.y + y, { color: '#888' });
                }
            }
        }
        ctx.restore();
    }
}

function updateScore(points) {
    score += points;
    let newLevel = Math.floor(score / 500) + 1;
    if (newLevel > level) {
        level = newLevel;
        playSoundEvent('levelUp');
    }
    dropInterval = Math.max(100, 1000 - ((level - 1) * 100));
    
    if (score >= 1000 && !reached1000) {
        speak("¡¡¡¡¡ que viene tu madreeee !!!!");
        reached1000 = true;
    }

    scoreEl.innerText = score;
    comboEl.innerText = comboCount;
    levelEl.innerText = level;
}

// Sequence logic separated from render loop for animation delays
async function executeLockSequence() {
    isAnimating = true;
    pieceCount++;
    let overflow = board.lockPiece(currentPiece);
    draw();

    if (overflow) {
        triggerGameOver();
        return;
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // 1. Landing Powerups (B, M)
    let res = board.checkPowerupsLanding(currentPiece);
    if (res.triggered) {
        playSoundEvent('bomb');
        updateScore(res.points);
        draw();
        await sleep(300);
        board.applyCascadeGravity();
        draw();
        await sleep(200);
    }

    // 2. Loop: Cascade -> Tetris -> Connect4 -> Repeat
    while (true) {
        let linesToClear = board.clearLines();
        if (linesToClear.length > 0) {
            board.highlightedRows = linesToClear;
            playSoundEvent('clear');
            draw();
            await sleep(300);
            board.highlightedRows = [];
            board.removeLines(linesToClear);
            updateScore(linesToClear.length * 100);
            draw();
            await sleep(100);
        }

        let c4 = board.checkConnect4();
        if (c4.triggered) {
            comboCount++;
            playSoundEvent('connect4');
            
            // Funny Blink Animation
            for (let i = 0; i < 4; i++) {
                board.highlightedBlocks = c4.coords;
                draw();
                await sleep(80);
                board.highlightedBlocks = [];
                draw();
                await sleep(80);
            }

            board.removeBlocks(c4.coords);
            updateScore(1000);
            draw();
            await sleep(100);
        }

        if (linesToClear.length > 0 || c4.triggered) {
            let moved = board.applyCascadeGravity();
            if (moved) {
                draw();
                await sleep(200);
            }
        } else {
            break;
        }
    }

    // 3. Update blocked blocks turns
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            let block = board.grid[y][x];
            if (block && block.isBlocked) {
                block.blockedTurns--;
                if (block.blockedTurns <= 0) {
                    block.isBlocked = false;
                    block.color = block.originalColor;
                }
            }
        }
    }

    // 4. Level 8+ Obstacles
    if (level >= 8 && pieceCount % 10 === 0) {
        board.grid.shift();
        let newRow = Array(COLS).fill(null);
        let holeCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 holes
        let holeIndices = new Set();
        while (holeIndices.size < holeCount) holeIndices.add(Math.floor(Math.random() * COLS));
        
        for (let x = 0; x < COLS; x++) {
            if (!holeIndices.has(x)) {
                let obs = new Block('#555', null);
                obs.isBlocked = true;
                obs.blockedTurns = 999; // Permanent obstacle
                newRow[x] = obs;
            }
        }
        board.grid.push(newRow);
        playSoundEvent('bomb');
    }

    // Next piece
    currentPiece = nextPiece;
    nextPiece = new Piece(Math.floor(COLS / 2) - 2, -2);
    
    // 4. Check if Game Over after all clears
    if (!board.isValidPos(currentPiece)) {
        triggerGameOver();
    }

    isAnimating = false;
    canHold = true; // Allow hold again for the next piece
    dropCounter = 0;
}

function triggerGameOver() {
    gameOver = true;
    playSoundEvent('gameover');
    gameOverScreen.classList.remove('hidden');
    finalScoreEl.innerText = score;
    speak(`¡muy bien machote, has conseguido ${score} puntos!`, 0.8, 1.1); // Mocking deep voice
}

function update(time = 0) {
    if (gameOver) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    if (!isPaused && !isAnimating) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            if (board.isValidPos(currentPiece, 0, 1)) {
                currentPiece.y++;
            } else {
                executeLockSequence();
            }
            dropCounter = 0;
        }
    }

    draw();
    reqId = requestAnimationFrame(update);
}

function startGame() {
    if (reqId) cancelAnimationFrame(reqId);
    board = new Board();
    score = 0;
    level = 1;
    pieceCount = 0;
    comboCount = 0;
    reached1000 = false;
    gameOver = false;
    isPaused = false;
    isAnimating = false;
    canHold = true;
    heldPiece = null;
    dropInterval = 1000;
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    pauseBtn.innerText = "PAUSAR";
    updateScore(0);
    
    currentPiece = new Piece(Math.floor(COLS / 2) - 2, -2);
    nextPiece = new Piece(Math.floor(COLS / 2) - 2, -2);
    
    lastTime = performance.now();
    playSoundEvent('start');
    update(lastTime);
}

// Inputs
function moveLeft() {
    if (isAnimating || gameOver || isPaused) return;
    if (board.isValidPos(currentPiece, -1, 0)) {
        currentPiece.x--;
        draw();
    }
}
function moveRight() {
    if (isAnimating || gameOver || isPaused) return;
    if (board.isValidPos(currentPiece, 1, 0)) {
        currentPiece.x++;
        draw();
    }
}
function rotate() {
    if (isAnimating || gameOver || isPaused) return;
    const oldBlocks = currentPiece.blocks;
    currentPiece.rotate();
    if (!board.isValidPos(currentPiece)) {
        currentPiece.blocks = oldBlocks; // revert
    }
    draw();
}
function drop() {
    if (isAnimating || gameOver || isPaused) return;
    if (board.isValidPos(currentPiece, 0, 1)) {
        currentPiece.y++;
        dropCounter = 0;
        draw();
    }
}
function hardDrop() {
    if (isAnimating || gameOver || isPaused) return;
    while (board.isValidPos(currentPiece, 0, 1)) {
        currentPiece.y++;
    }
    executeLockSequence();
}

function toggleHold() {
    if (isAnimating || gameOver || isPaused || !canHold) return;
    
    if (heldPiece === null) {
        heldPiece = currentPiece;
        currentPiece = nextPiece;
        nextPiece = new Piece(Math.floor(COLS / 2) - 2, -2);
    } else {
        let temp = currentPiece;
        currentPiece = heldPiece;
        heldPiece = temp;
    }
    canHold = false;
    draw();
}

// Keyboard
document.addEventListener('keydown', event => {
    switch (event.code) {
        case 'ArrowLeft': moveLeft(); break;
        case 'ArrowRight': moveRight(); break;
        case 'ArrowUp': rotate(); break;
        case 'ArrowDown': drop(); break;
        case 'Space': hardDrop(); break;
        case 'KeyH': toggleHold(); break;
    }
});

// Buttons
startBtn.addEventListener('click', () => {
    initAudio();
    startGame();
    // Blur to avoid spacebar pressing it again
    startBtn.blur();
});

pauseBtn.addEventListener('click', togglePause);

function togglePause() {
    if (gameOver || !currentPiece) return;
    isPaused = !isPaused;
    if (isPaused) {
        pauseScreen.classList.remove('hidden');
        pauseBtn.innerText = "REANUDAR";
        if (btnMobilePause) btnMobilePause.innerText = "▶";
    } else {
        pauseScreen.classList.add('hidden');
        pauseBtn.innerText = "PAUSAR";
        if (btnMobilePause) btnMobilePause.innerText = "⏸";
        lastTime = performance.now(); // reset time to prevent instant drop
    }
    pauseBtn.blur();
}

if (btnMobilePause) {
    btnMobilePause.addEventListener('click', togglePause);
}

if (holdBtn) {
    holdBtn.addEventListener('click', () => {
        initAudio();
        toggleHold();
        holdBtn.blur();
    });
}

// Mobile Tabs Logic
if (tabPlay && tabInfo) {
    tabPlay.addEventListener('click', () => {
        initAudio();
        if (tabPlay.classList.contains('active')) {
            startGame();
            tabPlay.innerText = "REINICIAR";
        } else {
            tabPlay.classList.add('active');
            tabInfo.classList.remove('active');
            gameContainer.classList.remove('hidden');
            mobileInfoPanel.classList.add('hidden');
            mobileInfoPanel.classList.remove('active');
            if (touchControls) touchControls.classList.remove('hidden');
        }
    });

    tabInfo.addEventListener('click', () => {
        initAudio();
        tabInfo.classList.add('active');
        tabPlay.classList.remove('active');
        gameContainer.classList.add('hidden');
        mobileInfoPanel.classList.remove('hidden');
        mobileInfoPanel.classList.add('active');
        if (touchControls) touchControls.classList.add('hidden');
    });
}

// Touch mapping (prevent default to stop zoom/scroll)
const addTouch = (el, action) => {
    if(el) {
        el.addEventListener('touchstart', (e) => { 
            initAudio();
            e.preventDefault(); 
            action(); 
        }, {passive: false});
        // También click para testeos rápidos con mouse en móvil view
        el.addEventListener('mousedown', (e) => { 
            initAudio();
            e.preventDefault(); 
            action(); 
        });
    }
};

addTouch(btnLeft, moveLeft);
addTouch(btnRight, moveRight);
addTouch(btnUp, rotate);
addTouch(btnDrop, hardDrop);
addTouch(btnHold, toggleHold);

// Initial Draw (Empty State)
draw();

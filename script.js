const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextPieceCanvas');
const nextCtx = nextCanvas.getContext('2d');

const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen = document.getElementById('pauseScreen');
const finalScoreEl = document.getElementById('finalScore');

// Touch Controls
const btnUp = document.getElementById('btnUp');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnDown = document.getElementById('btnDown');
const btnDrop = document.getElementById('btnDrop');

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
        this.powerup = powerup;
    }
}

class Piece {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        const shapeType = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        
        this.blocks = [];
        for (let r = 0; r < shapeType.length; r++) {
            let row = [];
            for (let c = 0; c < shapeType[r].length; c++) {
                if (shapeType[r][c]) {
                    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
                    let powerup = null;
                    if (Math.random() < 0.03) { // Reduced to 3% to avoid random disappearances early on
                        powerup = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
                    }
                    row.push(new Block(color, powerup));
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
        for (let y = 0; y < piece.blocks.length; y++) {
            for (let x = 0; x < piece.blocks[y].length; x++) {
                if (piece.blocks[y][x]) {
                    let newY = piece.y + y;
                    let newX = piece.x + x;
                    if (newY >= 0) {
                        this.grid[newY][newX] = piece.blocks[y][x];
                    }
                }
            }
        }
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
        let linesCleared = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
            let isFull = true;
            for (let x = 0; x < COLS; x++) {
                if (!this.grid[y][x]) {
                    isFull = false;
                    break;
                }
            }
            if (isFull) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(COLS).fill(null));
                linesCleared++;
                y++; // Re-check the current row index since things shifted down
            }
        }
        return linesCleared;
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
                if (this.grid[y][x]) {
                    for (let [dx, dy] of directions) {
                        let matchCoords = [[x, y]];
                        let currX = x + dx;
                        let currY = y + dy;
                        
                        while (currX >= 0 && currX < COLS && currY >= 0 && currY < ROWS) {
                            let prevCell = this.grid[matchCoords[matchCoords.length-1][1]][matchCoords[matchCoords.length-1][0]];
                            let currCell = this.grid[currY][currX];
                            
                            if (isMatch(prevCell, currCell)) {
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
                }
            }
        }

        let points = toRemove.size * 100;
        toRemove.forEach(pos => {
            let [px, py] = pos.split(',').map(Number);
            this.grid[py][px] = null;
        });

        return { points, triggered: toRemove.size > 0 };
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
let score = 0;
let level = 1;
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
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    
    // Inner Shadow/Highlight for 3D effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE / 4); // top light
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + (BLOCK_SIZE * 0.75), BLOCK_SIZE, BLOCK_SIZE / 4); // bottom shadow
    
    // Border
    ctx.strokeStyle = '#000';
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
        // Center it
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
}

function updateScore(points) {
    score += points;
    level = Math.floor(score / 500) + 1;
    dropInterval = Math.max(100, 1000 - ((level - 1) * 100));
    
    scoreEl.innerText = score;
    levelEl.innerText = level;
}

// Sequence logic separated from render loop for animation delays
async function executeLockSequence() {
    isAnimating = true;
    board.lockPiece(currentPiece);
    draw();

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // 1. Landing Powerups (B, M)
    let res = board.checkPowerupsLanding(currentPiece);
    if (res.triggered) {
        updateScore(res.points);
        draw();
        await sleep(300);
        board.applyCascadeGravity();
        draw();
        await sleep(200);
    }

    // 2. Loop: Cascade -> Tetris -> Connect4 -> Repeat
    while (true) {
        let lines = board.clearLines();
        if (lines > 0) {
            updateScore([0, 100, 300, 500, 800][lines]);
            draw();
            await sleep(200);
        }

        let c4 = board.checkConnect4();
        if (c4.triggered) {
            updateScore(c4.points);
            draw();
            await sleep(200);
        }

        if (lines > 0 || c4.triggered) {
            let moved = board.applyCascadeGravity();
            if (moved) {
                draw();
                await sleep(200);
            }
        } else {
            break;
        }
    }

    // Next piece
    currentPiece = nextPiece;
    nextPiece = new Piece(Math.floor(COLS / 2) - 2, -2);
    
    if (!board.isValidPos(currentPiece)) {
        gameOver = true;
        gameOverScreen.classList.remove('hidden');
        finalScoreEl.innerText = score;
    }

    isAnimating = false;
    dropCounter = 0;
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
    board = new Board();
    score = 0;
    level = 1;
    dropInterval = 1000;
    gameOver = false;
    isPaused = false;
    isAnimating = false;
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    pauseBtn.innerText = "PAUSAR";
    updateScore(0);
    
    currentPiece = new Piece(Math.floor(COLS / 2) - 2, -2);
    nextPiece = new Piece(Math.floor(COLS / 2) - 2, -2);
    
    if (reqId) cancelAnimationFrame(reqId);
    lastTime = performance.now();
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

// Keyboard
document.addEventListener('keydown', event => {
    switch (event.code) {
        case 'ArrowLeft': moveLeft(); break;
        case 'ArrowRight': moveRight(); break;
        case 'ArrowUp': rotate(); break;
        case 'ArrowDown': drop(); break;
        case 'Space': hardDrop(); break;
    }
});

// Buttons
startBtn.addEventListener('click', () => {
    startBtn.innerText = "REINICIAR";
    startGame();
    // Blur to avoid spacebar pressing it again
    startBtn.blur();
});

pauseBtn.addEventListener('click', () => {
    if (gameOver || !currentPiece) return;
    isPaused = !isPaused;
    if (isPaused) {
        pauseScreen.classList.remove('hidden');
        pauseBtn.innerText = "REANUDAR";
    } else {
        pauseScreen.classList.add('hidden');
        pauseBtn.innerText = "PAUSAR";
        lastTime = performance.now(); // reset time to prevent instant drop
    }
    pauseBtn.blur();
});

// Touch mapping (prevent default to stop zoom/scroll)
const addTouch = (el, action) => {
    if(el) {
        el.addEventListener('touchstart', (e) => { e.preventDefault(); action(); }, {passive: false});
        // También click para testeos rápidos con mouse en móvil view
        el.addEventListener('mousedown', (e) => { e.preventDefault(); action(); });
    }
};

addTouch(btnLeft, moveLeft);
addTouch(btnRight, moveRight);
addTouch(btnUp, rotate);
addTouch(btnDown, drop);
addTouch(btnDrop, hardDrop);

// Initial Draw (Empty State)
draw();

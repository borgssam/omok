// HTML5 Canvas Omok Board Renderer & Interactive Handler
class OmokBoard {
    constructor(canvasId, onCellClickCallback) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.onCellClick = onCellClickCallback;

        this.boardSize = 15;
        this.boardState = Array(15).fill(0).map(() => Array(15).fill(0));
        this.hoverCell = null;
        this.lastMove = null;
        this.winningLine = null;

        this.padding = 32;
        this.cellSize = 0;

        this.initCanvas();
        this.bindEvents();
    }

    initCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        const displayWidth = rect.width || 580;

        this.canvas.width = displayWidth * dpr;
        this.canvas.height = displayWidth * dpr;
        this.ctx.scale(dpr, dpr);

        this.cellSize = (displayWidth - this.padding * 2) / (this.boardSize - 1);
        this.draw();
    }

    bindEvents() {
        window.addEventListener('resize', () => this.initCanvas());

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const col = Math.round((x - this.padding) / this.cellSize);
            const row = Math.round((y - this.padding) / this.cellSize);

            if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize) {
                if (this.boardState[row][col] === 0) {
                    if (!this.hoverCell || this.hoverCell.row !== row || this.hoverCell.col !== col) {
                        this.hoverCell = { row, col };
                        this.draw();
                    }
                } else if (this.hoverCell) {
                    this.hoverCell = null;
                    this.draw();
                }
            } else if (this.hoverCell) {
                this.hoverCell = null;
                this.draw();
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            if (this.hoverCell) {
                this.hoverCell = null;
                this.draw();
            }
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const col = Math.round((x - this.padding) / this.cellSize);
            const row = Math.round((y - this.padding) / this.cellSize);

            if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize) {
                if (this.onCellClick) {
                    this.onCellClick(row, col);
                }
            }
        });
    }

    setBoardState(board, lastMove = null, winningLine = null) {
        this.boardState = board;
        this.lastMove = lastMove;
        this.winningLine = winningLine;
        this.draw();
    }

    draw() {
        const displayWidth = this.canvas.width / (window.devicePixelRatio || 1);
        this.ctx.clearRect(0, 0, displayWidth, displayWidth);

        // Draw wooden texture board background
        this.drawBoardBackground(displayWidth);

        // Draw grid lines
        this.drawGrid();

        // Draw star points (Hoshi)
        this.drawStarPoints();

        // Draw placed stones
        this.drawStones();

        // Draw hover preview
        this.drawHover();

        // Draw last move marker
        this.drawLastMoveMarker();

        // Draw winning line highlight
        this.drawWinningLine();
    }

    drawBoardBackground(size) {
        const grad = this.ctx.createRadialGradient(size/2, size/2, size/8, size/2, size/2, size*0.7);
        grad.addColorStop(0, '#e8be89');
        grad.addColorStop(1, '#cda168');

        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, size, size);

        // Outer border line
        this.ctx.strokeStyle = '#8c6239';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(4, 4, size - 8, size - 8);
    }

    drawGrid() {
        this.ctx.strokeStyle = '#5c3d1e';
        this.ctx.lineWidth = 1.2;

        for (let i = 0; i < this.boardSize; i++) {
            const pos = this.padding + i * this.cellSize;

            // Horizontal line
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, pos);
            this.ctx.lineTo(this.padding + (this.boardSize - 1) * this.cellSize, pos);
            this.ctx.stroke();

            // Vertical line
            this.ctx.beginPath();
            this.ctx.moveTo(pos, this.padding);
            this.ctx.lineTo(pos, this.padding + (this.boardSize - 1) * this.cellSize);
            this.ctx.stroke();
        }
    }

    drawStarPoints() {
        const hoshiPoints = [
            [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
        ];

        this.ctx.fillStyle = '#5c3d1e';
        hoshiPoints.forEach(([r, c]) => {
            const x = this.padding + c * this.cellSize;
            const y = this.padding + r * this.cellSize;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawStones() {
        const stoneRadius = this.cellSize * 0.44;

        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                const val = this.boardState[r][c];
                if (val !== 0) {
                    const x = this.padding + c * this.cellSize;
                    const y = this.padding + r * this.cellSize;
                    this.drawStone(x, y, stoneRadius, val === 1 ? 'black' : 'white');
                }
            }
        }
    }

    drawStone(x, y, radius, color) {
        this.ctx.save();

        // Drop shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetX = 3;
        this.ctx.shadowOffsetY = 4;

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);

        if (color === 'black') {
            const grad = this.ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
            grad.addColorStop(0, '#555');
            grad.addColorStop(0.5, '#222');
            grad.addColorStop(1, '#050505');
            this.ctx.fillStyle = grad;
        } else {
            const grad = this.ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.8, '#e2e8f0');
            grad.addColorStop(1, '#cbd5e1');
            this.ctx.fillStyle = grad;
        }

        this.ctx.fill();
        this.ctx.restore();
    }

    drawHover() {
        if (!this.hoverCell) return;

        const x = this.padding + this.hoverCell.col * this.cellSize;
        const y = this.padding + this.hoverCell.row * this.cellSize;

        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(79, 172, 254, 0.8)';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.cellSize * 0.3, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawLastMoveMarker() {
        if (!this.lastMove) return;

        const [r, c, player] = this.lastMove;
        const x = this.padding + c * this.cellSize;
        const y = this.padding + r * this.cellSize;

        this.ctx.save();
        this.ctx.fillStyle = player === 1 ? '#4facfe' : '#e11d48';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawWinningLine() {
        if (!this.winningLine || this.winningLine.length < 5) return;

        const first = this.winningLine[0];
        const last = this.winningLine[this.winningLine.length - 1];

        const x1 = this.padding + first[1] * this.cellSize;
        const y1 = this.padding + first[0] * this.cellSize;
        const x2 = this.padding + last[1] * this.cellSize;
        const y2 = this.padding + last[0] * this.cellSize;

        this.ctx.save();
        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.shadowColor = '#fbbf24';
        this.ctx.shadowBlur = 12;

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.restore();
    }
}

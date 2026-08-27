// Main Application Controller for Omok Game
document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const canvas = document.getElementById('omok-canvas');
    const statusMsg = document.getElementById('status-msg');
    const turnBadge = document.getElementById('turn-badge');
    const turnText = document.getElementById('turn-text');
    const scoreBlackEl = document.getElementById('score-black');
    const scoreWhiteEl = document.getElementById('score-white');

    const overlay = document.getElementById('board-overlay');
    const winnerText = document.getElementById('winner-text');
    const winnerSubtext = document.getElementById('winner-subtext');

    const btnModeAi = document.getElementById('btn-mode-ai');
    const btnModeLocal = document.getElementById('btn-mode-local');
    const btnModeOnline = document.getElementById('btn-mode-online');

    const aiSettings = document.getElementById('ai-settings');
    const selectAiDifficulty = document.getElementById('ai-difficulty');

    const onlineSettings = document.getElementById('online-settings');
    const btnCreateRoom = document.getElementById('btn-create-room');
    const btnJoinRoom = document.getElementById('btn-join-room');
    const inputRoomCode = document.getElementById('input-room-code');
    const roomInfo = document.getElementById('room-info');
    const currentRoomCode = document.getElementById('current-room-code');
    const btnCopyCode = document.getElementById('btn-copy-code');

    const btnNewGame = document.getElementById('btn-new-game');
    const btnUndo = document.getElementById('btn-undo');
    const btnRestartModal = document.getElementById('btn-restart-modal');
    const btnSoundToggle = document.getElementById('btn-sound-toggle');

    const chatSection = document.getElementById('chat-section');
    const chatMessages = document.getElementById('chat-messages');
    const inputChat = document.getElementById('input-chat');
    const btnSendChat = document.getElementById('btn-send-chat');

    // Game State Variables
    let gameMode = 'ai'; // 'ai', 'local', 'online'
    let currentTurn = 1; // 1: Black, 2: White
    let boardState = Array(15).fill(0).map(() => Array(15).fill(0));
    let moveHistory = [];
    let isGameOver = false;
    let winner = null;
    let winningLine = null;

    let scores = { black: 0, white: 0 };
    let isAiProcessing = false;

    // WebSocket Client Instance
    let wsClient = null;

    // Initialize Board Canvas Renderer
    const boardRenderer = new OmokBoard('omok-canvas', handleCellClick);

    // Initial setup
    resetLocalGame();

    // -------------------------------------------------------------
    // Core Game Logic
    // -------------------------------------------------------------

    function handleCellClick(row, col) {
        if (isGameOver || isAiProcessing) return;

        if (gameMode === 'online') {
            if (wsClient && wsClient.myColor === currentTurn) {
                sounds.playPlaceStone();
                wsClient.sendMove(row, col);
            } else {
                showStatus('당신의 턴이 아닙니다!');
            }
            return;
        }

        // Local or AI mode
        if (boardState[row][col] !== 0) return;

        if (gameMode === 'ai' && currentTurn === 2) return; // Prevent clicking during AI turn

        makeLocalMove(row, col, currentTurn);

        // Trigger AI move if in AI mode and game is not over
        if (gameMode === 'ai' && !isGameOver && currentTurn === 2) {
            triggerAiMove();
        }
    }

    function makeLocalMove(row, col, player) {
        boardState[row][col] = player;
        moveHistory.push([row, col, player]);

        sounds.playPlaceStone();

        // Check local win condition
        const winLine = checkWinLocal(row, col, player);
        if (winLine) {
            isGameOver = true;
            winner = player;
            winningLine = winLine;
            scores[player === 1 ? 'black' : 'white'] += 1;
            updateScoreDisplay();

            if (player === 1) {
                sounds.playWin();
            } else if (gameMode === 'ai') {
                sounds.playLose();
            } else {
                sounds.playWin();
            }

            showGameOverModal(player === 1 ? '흑돌 승리! 🎉' : '백돌 승리! 🎉', `${moveHistory.length}수만에 5목을 완성했습니다.`);
        } else if (moveHistory.length === 225) {
            isGameOver = true;
            winner = 0;
            showGameOverModal('무승부! 🤝', '바둑판이 가득 찼습니다.');
        } else {
            currentTurn = player === 1 ? 2 : 1;
        }

        updateUI();
    }

    async function triggerAiMove() {
        isAiProcessing = true;
        showStatus('AI가 생각 중입니다... 🤔');

        try {
            const difficulty = selectAiDifficulty.value;
            const res = await fetch('/api/ai/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    board: boardState,
                    difficulty: difficulty,
                    ai_player: 2
                })
            });

            if (!res.ok) throw new Error('AI API Call failed');

            const data = await res.json();
            isAiProcessing = false;

            if (!isGameOver) {
                makeLocalMove(data.row, data.col, 2);
                showStatus('당신의 턴입니다.');
            }
        } catch (err) {
            console.error('AI Move Error:', err);
            isAiProcessing = false;
            showStatus('AI 착수 실패. 다시 시도해 주세요.');
        }
    }

    function checkWinLocal(row, col, player) {
        const directions = [
            [0, 1],  // Horizontal
            [1, 0],  // Vertical
            [1, 1],  // Diagonal down-right
            [1, -1]  // Diagonal down-left
        ];

        for (const [dr, dc] of directions) {
            const line = [[row, col]];

            let r = row + dr;
            let c = col + dc;
            while (r >= 0 && r < 15 && c >= 0 && c < 15 && boardState[r][c] === player) {
                line.push([r, c]);
                r += dr;
                c += dc;
            }

            r = row - dr;
            c = col - dc;
            while (r >= 0 && r < 15 && c >= 0 && c < 15 && boardState[r][c] === player) {
                line.push([r, c]);
                r -= dr;
                c -= dc;
            }

            if (line.length >= 5) {
                return line;
            }
        }
        return null;
    }

    function undoLocalMove() {
        if (moveHistory.length === 0 || isGameOver) return;

        sounds.playClick();

        if (gameMode === 'ai') {
            // Undo twice (AI move + User move)
            if (moveHistory.length >= 2) {
                const [r1, c1] = moveHistory.pop();
                boardState[r1][c1] = 0;
                const [r2, c2] = moveHistory.pop();
                boardState[r2][c2] = 0;
            } else if (moveHistory.length === 1) {
                const [r1, c1] = moveHistory.pop();
                boardState[r1][c1] = 0;
            }
            currentTurn = 1;
        } else {
            const [r, c, p] = moveHistory.pop();
            boardState[r][c] = 0;
            currentTurn = p;
        }

        isGameOver = false;
        winner = null;
        winningLine = null;
        updateUI();
    }

    function resetLocalGame() {
        boardState = Array(15).fill(0).map(() => Array(15).fill(0));
        moveHistory = [];
        currentTurn = 1;
        isGameOver = false;
        winner = null;
        winningLine = null;
        hideGameOverModal();
        updateUI();
        showStatus(gameMode === 'ai' ? '새 게임 시작! 당신은 흑돌(선공)입니다.' : '새 게임 시작!');
    }

    // -------------------------------------------------------------
    // UI & Event Bindings
    // -------------------------------------------------------------

    function updateUI() {
        const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;
        boardRenderer.setBoardState(boardState, lastMove, winningLine);

        // Turn indicator
        if (currentTurn === 1) {
            turnBadge.className = 'turn-badge black-turn';
            turnText.textContent = '흑돌 (Black) 턴';
        } else {
            turnBadge.className = 'turn-badge white-turn';
            turnText.textContent = '백돌 (White) 턴';
        }
    }

    function updateScoreDisplay() {
        scoreBlackEl.textContent = scores.black;
        scoreWhiteEl.textContent = scores.white;
    }

    function showStatus(msg) {
        statusMsg.textContent = msg;
    }

    function showGameOverModal(title, subtext) {
        winnerText.textContent = title;
        winnerSubtext.textContent = subtext;
        overlay.classList.remove('hidden');
    }

    function hideGameOverModal() {
        overlay.classList.add('hidden');
    }

    // Mode Switch Handler
    [btnModeAi, btnModeLocal, btnModeOnline].forEach(btn => {
        btn.addEventListener('click', (e) => {
            sounds.playClick();
            document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
            const selectedBtn = e.currentTarget;
            selectedBtn.classList.add('active');

            gameMode = selectedBtn.dataset.mode;

            aiSettings.classList.toggle('hidden', gameMode !== 'ai');
            onlineSettings.classList.toggle('hidden', gameMode !== 'online');
            chatSection.classList.toggle('hidden', gameMode !== 'online');

            if (gameMode !== 'online' && wsClient) {
                wsClient.disconnect();
                wsClient = null;
            }

            resetLocalGame();
        });
    });

    // Control Buttons
    btnNewGame.addEventListener('click', () => {
        sounds.playClick();
        if (gameMode === 'online' && wsClient) {
            wsClient.sendReset();
        } else {
            resetLocalGame();
        }
    });

    btnUndo.addEventListener('click', () => {
        if (gameMode === 'online' && wsClient) {
            wsClient.sendUndo();
        } else {
            undoLocalMove();
        }
    });

    btnRestartModal.addEventListener('click', () => {
        sounds.playClick();
        if (gameMode === 'online' && wsClient) {
            wsClient.sendReset();
        } else {
            resetLocalGame();
        }
    });

    btnSoundToggle.addEventListener('click', () => {
        const muted = sounds.toggleMute();
        btnSoundToggle.textContent = muted ? '🔇' : '🔊';
    });

    // -------------------------------------------------------------
    // Online Multiplayer WebSocket Handlers
    // -------------------------------------------------------------

    btnCreateRoom.addEventListener('click', async () => {
        sounds.playClick();
        try {
            const res = await fetch('/api/rooms', { method: 'POST' });
            const data = await res.json();

            setupOnlineRoom(data.room_id);
        } catch (err) {
            showStatus('방 생성 실패');
        }
    });

    btnJoinRoom.addEventListener('click', () => {
        sounds.playClick();
        const code = inputRoomCode.value.trim().toUpperCase();
        if (code.length === 6) {
            setupOnlineRoom(code);
        } else {
            showStatus('6자리 방 코드를 입력하세요.');
        }
    });

    btnCopyCode.addEventListener('click', () => {
        sounds.playClick();
        const code = currentRoomCode.textContent;
        if (code && code !== '-') {
            navigator.clipboard.writeText(code);
            showStatus('방 코드가 클립보드에 복사되었습니다.');
        }
    });

    function setupOnlineRoom(roomId) {
        currentRoomCode.textContent = roomId;
        roomInfo.classList.remove('hidden');

        wsClient = new OmokWSClient(
            handleOnlineStateUpdate,
            handleOnlineChat,
            (connData) => {
                showStatus(`온라인 방 [${roomId}] 접속 완료 (${connData.color_name})`);
            }
        );
        wsClient.connect(roomId);
    }

    function handleOnlineStateUpdate(data) {
        const state = data.state;
        boardState = state.board;
        currentTurn = state.current_turn;
        moveHistory = state.move_history || [];
        isGameOver = state.is_game_over;
        winner = state.winner;
        winningLine = state.winning_line;

        const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;
        boardRenderer.setBoardState(boardState, lastMove, winningLine);

        // Play audio on state update
        if (lastMove) {
            sounds.playPlaceStone();
        }

        if (isGameOver) {
            if (winner === 1) showGameOverModal('흑돌 승리! 🎉', '5목을 완성했습니다.');
            else if (winner === 2) showGameOverModal('백돌 승리! 🎉', '5목을 완성했습니다.');
            else showGameOverModal('무승부! 🤝', '바둑판이 가득 찼습니다.');
        } else {
            hideGameOverModal();
        }

        updateUI();
    }

    function handleOnlineChat(data) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-item';
        msgDiv.innerHTML = `<span class="chat-sender">${data.sender}:</span> ${data.message}`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    btnSendChat.addEventListener('click', sendChatMessage);
    inputChat.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });

    function sendChatMessage() {
        const text = inputChat.value.trim();
        if (text && wsClient) {
            wsClient.sendChat(text);
            inputChat.value = '';
        }
    }
});

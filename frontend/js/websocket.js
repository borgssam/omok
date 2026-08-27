// WebSocket Client Manager for Multiplayer Omok
class OmokWSClient {
    constructor(onStateUpdateCallback, onChatCallback, onConnectCallback) {
        this.socket = null;
        this.roomId = null;
        this.clientId = 'client_' + Math.random().toString(36).substring(2, 9);
        this.myColor = null;

        this.onStateUpdate = onStateUpdateCallback;
        this.onChat = onChatCallback;
        this.onConnect = onConnectCallback;
    }

    connect(roomId) {
        this.roomId = roomId;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host || 'localhost:8000';
        const wsUrl = `${protocol}//${host}/ws/omok/${roomId}/${this.clientId}`;

        if (this.socket) {
            this.socket.close();
        }

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log(`Connected to room ${roomId}`);
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'connected') {
                    this.myColor = data.color;
                    if (this.onConnect) {
                        this.onConnect(data);
                    }
                } else if (data.type === 'state_update') {
                    if (this.onStateUpdate) {
                        this.onStateUpdate(data);
                    }
                } else if (data.type === 'chat') {
                    if (this.onChat) {
                        this.onChat(data);
                    }
                }
            } catch (err) {
                console.error('Error parsing WebSocket message:', err);
            }
        };

        this.socket.onclose = () => {
            console.log('WebSocket connection closed');
        };

        this.socket.onerror = (err) => {
            console.error('WebSocket error:', err);
        };
    }

    sendMove(row, col) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                action: 'move',
                row: row,
                col: col
            }));
        }
    }

    sendReset() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ action: 'reset' }));
        }
    }

    sendUndo() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ action: 'undo' }));
        }
    }

    sendChat(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                action: 'chat',
                message: message
            }));
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

class WebSocketAdminClient {
    constructor() {
        this.socket = new WebSocket("ws://localhost:3003");
        this.readyPromise = new Promise((resolve, reject) => {
            this.socket.onopen = () => {
                console.log("✅ WebSocket connected");
                resolve();
            };
            this.socket.onerror = (err) => {
                console.error("❌ WebSocket error", err);
                reject(err);
            };
        });

        this.socket.onclose = () => {
            console.warn("⚠️ WebSocket closed");
        };
    }

    async send(message) {
        await this.readyPromise;
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        } else {
            console.warn("WebSocket not open. Can't send:", message);
        }
    }

    onMessage(callback) {
        this.socket.onmessage = (event) => {
            callback(event.data);
        };
    }

    close() {
        this.socket.close();
    }
}

export default WebSocketAdminClient;

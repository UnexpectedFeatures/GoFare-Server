class WebSocketAdminClient {
    constructor(url = "ws://localhost:3003") {
        this.url = url;
        this.socket = null;
        this.readyPromise = null;
        this.reconnectDelay = 1000; // Initial delay (1 second)
        this.maxReconnectDelay = 10000; // Maximum reconnect delay (10 seconds)
        this.connect();
    }

    // Connect or reconnect the WebSocket
    connect() {
        this.socket = new WebSocket(this.url);
        this.readyPromise = new Promise((resolve, reject) => {
            this.socket.onopen = () => {
                console.log("✅ WebSocket connected");
                resolve();
                this.reconnectDelay = 1000; // Reset delay on successful connection
            };
            this.socket.onerror = (err) => {
                console.error("❌ WebSocket error", err);
                reject(err);
            };
        });

        this.socket.onclose = (event) => {
            console.warn("⚠️ WebSocket closed", event);
            // Retry connection with increasing delay
            setTimeout(() => this.connect(), Math.min(this.reconnectDelay, this.maxReconnectDelay));
            this.reconnectDelay *= 2; // Double the reconnect delay (exponential backoff)
        };
    }

    // Send message, wait until WebSocket is ready
    async send(message) {
        await this.readyPromise; // Wait for the WebSocket to be ready
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        } else {
            console.warn("WebSocket not open. Can't send:", message);
            // Optionally retry sending after a short delay or retry logic can be implemented
            setTimeout(() => this.send(message), 1000);
        }
    }

    // Listen to incoming messages
    onMessage(callback) {
        this.socket.onmessage = (event) => {
            callback(event.data);
        };
    }

    // Close the WebSocket connection
    close() {
        this.socket.close();
    }
}

export default WebSocketAdminClient;

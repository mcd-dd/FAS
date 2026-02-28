// Reconnecting WebSocket helper (simple, dependency-free)
export class ReconnectingWS {
  /**
   * url: ws://...
   * onMessage: (parsed) => void
   * options: { reconnectIntervalMs }
   */
  constructor(url, onMessage, options = {}) {
    this.url = url;
    this.onMessage = onMessage;
    this.reconnectIntervalMs = options.reconnectIntervalMs || 2000;
    this.ws = null;
    this.closedByUser = false;
    this._connect();
  }

  _connect() {
    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      console.warn("WS connect failed", e);
      setTimeout(() => this._connect(), this.reconnectIntervalMs);
      return;
    }

    this.ws.onopen = () => {
      console.info("WS open", this.url);
    };

    this.ws.onclose = (ev) => {
      if (!this.closedByUser) {
        console.warn("WS closed, reconnecting...", ev.code, ev.reason);
        setTimeout(() => this._connect(), this.reconnectIntervalMs);
      } else {
        console.info("WS closed by user");
      }
    };

    this.ws.onerror = (err) => {
      console.warn("WS error", err);
      // socket will usually fire onclose afterwards
    };

    this.ws.onmessage = (evt) => {
      try {
        const raw = JSON.parse(evt.data);
        if (this.onMessage) this.onMessage(raw);
      } catch (e) {
        // if payload is not JSON, pass raw text
        if (this.onMessage) this.onMessage(evt.data);
      }
    };
  }

  send(obj) {
    try {
      const msg = typeof obj === "string" ? obj : JSON.stringify(obj);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(msg);
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.warn("WS send failed", e);
      return false;
    }
  }

  close() {
    this.closedByUser = true;
    if (this.ws) this.ws.close();
  }
}

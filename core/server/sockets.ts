export class Sockets {
  sockets = new Map<string, WebSocket>();

  upgrade(request: Request) {
    const { socket, response } = Deno.upgradeWebSocket(request);
    const uid = crypto.randomUUID();

    socket.onopen = () => {
      this.sockets.set(uid, socket);
      this.update("socket-connect", {
        sockets: this.sockets.size,
        id: uid,
      });
    };

    socket.onmessage = (event) => {
      console.log(`RECEIVED: ${event.data}`);
    };

    socket.onclose = () => {
      this.sockets.delete(uid);
      this.update("socket-disconnect", {
        sockets: this.sockets.size,
        id: uid,
      });
    };
    socket.onerror = (error) => {
      this.sockets.delete(uid);
      console.error("ERROR:", error);
      this.update("socket-error", { sockets: this.sockets.size, id: uid });
    };

    return response;
  }

  update<Type>(type: string, message: Type) {
    this.sockets.forEach((socket) => {
      socket.send(JSON.stringify({ type, message }));
    });
  }
}

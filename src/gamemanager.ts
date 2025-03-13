import { Game } from "./game";
import { INIT_GAME, MOVE } from "./messages";
import WebSocket from "ws";

export class GameManager {
  private games: Game[] = [];
  private users: WebSocket[] = [];
  private pendingusers: WebSocket[] = [];

  constructor() {
    this.games = [];
    this.pendingusers = [];
    this.users = [];
  }

  addUser(socket: WebSocket) {
    this.users.push(socket);
    this.addHandler(socket);
  }

  removeUser(socket: WebSocket) {
    this.users = this.users.filter((user) => user !== socket);
    this.pendingusers = this.pendingusers.filter((user) => user !== socket);
    this.games = this.games.filter(
      (game) => game.player1 !== socket && game.player2 !== socket
    );
  }

  private addHandler(socket: WebSocket) {
    socket.on("message", (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === INIT_GAME) {
        if (this.pendingusers.length === 0) {
          // Add user to pending list
          if (socket.readyState === WebSocket.OPEN) {
            this.pendingusers.push(socket);
            console.log("Player waiting for an opponent");
          } else {
            console.error("Socket is not open, cannot add to pending list");
          }
        } else {
          // Start game with the first pending user
          const player1 = this.pendingusers.shift();
          if (player1 && player1.readyState === WebSocket.OPEN) {
            if (socket.readyState === WebSocket.OPEN) {
              const game = new Game(player1, socket);
              this.games.push(game);
              console.log("Game started between two players");
            } else {
              console.error("Socket is not open, cannot start game");
              this.pendingusers.unshift(player1); // Put the pending user back
            }
          } else {
            console.error("Pending user socket is not open or undefined");
          }
        }
      }

      if (message.type === MOVE) {
        const game = this.games.find(
          (game) => game.player1 === socket || game.player2 === socket
        );
        if (game) {
          game.makeMove(socket, message.move);
        } else {
          console.log("Move received from a socket not in any active game");
        }
      }
    });

    // Handle user disconnection
    socket.on("close", () => {
      console.log("User disconnected");
      this.removeUser(socket);
    });
  }
}

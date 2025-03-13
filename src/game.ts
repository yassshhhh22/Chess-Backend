import WebSocket from "ws";
import { Chess } from "chess.js";
import { INIT_GAME, MOVE, GAME_OVER } from "./messages";

export class Game {
  public player1: WebSocket;
  public player2: WebSocket;
  public board: Chess;
  private startTimer: Date;
  private moveCount = 0;

  constructor(player1: WebSocket, player2: WebSocket) {
    if (!player1 || player1.readyState !== WebSocket.OPEN) {
      throw new Error("player1 WebSocket is not open or undefined");
    }
    if (!player2 || player2.readyState !== WebSocket.OPEN) {
      throw new Error("player2 WebSocket is not open or undefined");
    }

    this.player1 = player1;
    this.player2 = player2;
    this.board = new Chess();
    this.startTimer = new Date();

    this.player1.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          color: "white",
        },
      })
    );
    this.player2.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          color: "black",
        },
      })
    );
  }

  makeMove(socket: WebSocket, move: { from: string; to: string }) {
    if (
      (this.moveCount % 2 === 0 && socket !== this.player1) ||
      (this.moveCount % 2 === 1 && socket !== this.player2)
    ) {
      return;
    }

    try {
      const result = this.board.move(move);
      if (!result) {
        throw new Error("Invalid move");
      }
      this.moveCount++;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Failed to make move:", e.message);
      } else {
        console.error("Failed to make move:", e);
      }
      return;
    }

    if (this.board.isGameOver()) {
      const winner = this.board.turn() === "w" ? "black" : "white";
      [this.player1, this.player2].forEach((player) => {
        if (player.readyState === WebSocket.OPEN) {
          player.send(
            JSON.stringify({
              type: GAME_OVER,
              payload: { winner },
            })
          );
        }
      });
      return;
    }
    if (this.moveCount % 2 === 0) {
      if (this.player1.readyState === WebSocket.OPEN) {
        this.player1.send(
          JSON.stringify({
            type: MOVE,
            payload: move,
          })
        );
      }
    }
    if (this.moveCount % 2 === 1) {
      if (this.player2.readyState === WebSocket.OPEN) {
        this.player2.send(
          JSON.stringify({
            type: MOVE,
            payload: move,
          })
        );
      }
    }
  }
}

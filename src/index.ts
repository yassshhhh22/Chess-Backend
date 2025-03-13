import { WebSocketServer } from "ws";
import { GameManager } from "./gamemanager";

const wss = new WebSocketServer({ port: 8080 });
const gamemanger = new GameManager();
wss.on("connection", function connection(ws) {
  gamemanger.addUser(ws);
  ws.on("disconnect", () => {
    gamemanger.removeUser(ws);
  });
});

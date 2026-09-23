import { WebSocket, WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });
const clients : WebSocket[] = [];

wss.on("connection", (ws) => {
  console.log('New connection');
  clients.push(ws);
  broadcast(clients, "Un nouveau joueur est arrive");
  console.log("Client numero: ", clients.length);

  ws.on("message", (data) => { ws.send(data.toString()) });

  ws.on("close", () => { console.log('He left');
    clients.splice(clients.indexOf(ws), 1);
   });
});

function broadcast(clients: WebSocket[], message: string, exclude?: WebSocket) {
  clients.forEach((client) => {
    if (exclude === undefined || exclude !== client)
        client.send(message);
  });
}
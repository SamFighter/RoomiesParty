import { WebSocket, WebSocketServer } from "ws";
import { Player, Room } from "./types";

//#################### Declaration
//####

const wss = new WebSocketServer({ port: 8080 });
const clients : WebSocket[] = [];
const parties = new Map<string, Room>();

//#################### Server
//####

wss.on("connection", (ws) => {
  console.log('New connection');
  clients.push(ws);
  broadcast(clients, "server: New Player just joined!");
  console.log("Client numero: ", clients.length);
  ws.on("message", (data) => { 
    const message = JSON.parse(data.toString());
    switch (message.type) 
    {
      case "create_room":
          let code = generateRoomCode();
          const room: Room = {
            id_host: ws,
            status: "waiting",
            creation_time: Date.now(),
            Players: new Map<string, Player>(),
          };
          parties.set(code, room);
          ws.send(JSON.stringify({ type:"room_created", code: code }))
          break;
      case "join_room":
        //join_room
        break;
      default:
        console.log(message);
    }
  });
  ws.on("close", () => { console.log('He left');
    clients.splice(clients.indexOf(ws), 1);
   });
});

//#################### Functions
//####

function broadcast(clients: WebSocket[], message: string, exclude?: WebSocket) {
  clients.forEach((client) => {
    if (exclude === undefined || exclude !== client)
        client.send(message);
  });
}

function generateRoomCode() {
    let code: string;
    do  { 
      code = Math.random().toString(36).substring(2, 8);
    } while (parties.has(code));
    return code;
}
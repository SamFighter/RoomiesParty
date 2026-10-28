import { WebSocket, WebSocketServer } from "ws";
import { JoinRoomMessage, Player, PlayerReadyMessage, Room } from "./types";

//#################### Declaration
//####

const wss = new WebSocketServer({ port: 8080 });
const clients : WebSocket[] = [];
const parties = new Map<string, Room>();
const PLAYER_MAX = 6;

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
            handleJoinRoom(ws, message);
            break;
        case "player_ready":
            handleReadyPlayer(ws, message);
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

function handleJoinRoom(client: WebSocket, message: JoinRoomMessage) {
    const code = message.code;
    const room = parties.get(code);
    const username = message.username;
    if (room === undefined) {
        client.send(JSON.stringify({ type: "error", reason: "room_not_found", code: code }))
        return;
    }
    if (room.status !== "waiting") {
        client.send(JSON.stringify({ type: "error", reason: "room_occupied", code: code }))
        return;
    }
    if (room.Players.size >= PLAYER_MAX) {
        client.send(JSON.stringify({ type: "error", reason: "room_full", code: code }))
        return;
    }
    if (!username) {
        client.send(JSON.stringify({ type: "error", reason: "username_empty", code: code }))
        return;
    }
    const alreadyExistant = Array.from(room.Players.values()).some((player) => {
        return player.username === username;
    });
    if (alreadyExistant) {
        client.send(JSON.stringify({ type: "error", reason: "username_taken", code: code}))
        return;
    }
    const player_id = crypto.randomUUID();
    const newPlayer: Player = {
      username: username,
      ready: false,
      id: player_id,
      ws: client
    }
    room.Players.set(player_id, newPlayer);
    client.send(JSON.stringify({ type: "success", reason: "join_room", code: code, id: player_id}))
    const playerArray = Array.from(room.Players.values())
    const wsPlayerArray = playerArray.map(player => player.ws)
    broadcast(wsPlayerArray, JSON.stringify({ type: "player_joined", username: username }), client);
}

function handleReadyPlayer(client: WebSocket, message: PlayerReadyMessage) {
    const code = message.code;
    const player_id = message.id
    const room = parties.get(code);
    if (room === undefined) {
        client.send(JSON.stringify({ type: "error", reason: "room_not_found", code: code }))
        return;
    }
    if (room.status === "playing") {
        client.send(JSON.stringify({ type: "error", reason: "game_ongoing", code: code }))
        return;
    }
    const actualPlayer = room.Players.get(player_id)
    if (actualPlayer === undefined) {
        client.send(JSON.stringify({ type: "error", reason: "player_not_found", code: code}))
        return;
    }
    actualPlayer.ready = message.ready;
    client.send(JSON.stringify({ type: "success", reason: "player_ready", code: code, ready: actualPlayer.ready}))
    const playerArray = Array.from(room.Players.values())
    const wsPlayerArray = playerArray.map(player => player.ws)
    broadcast(wsPlayerArray, JSON.stringify({ type: "player_is_ready", username: actualPlayer.username, ready: actualPlayer.ready}), client);
    room.id_host.send(JSON.stringify({ type: "Host - success", reason: "player_is_ready", username: actualPlayer.username, code: code, ready: actualPlayer.ready}))
}
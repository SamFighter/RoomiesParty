import { WebSocket } from "ws";

export type Room = {
    id_host:        WebSocket;
    status:         "waiting" | "playing" | "finished";
    creation_time:  number;
    Players:        Map<string, Player>;
}

export type Player = {
    username:   string;
    ready:      boolean;
    id:         string;
    ws:         WebSocket;
}

export type JoinRoomMessage = {
    type:           "join_room";
    code:           string;
    username:       string;
    reconnectId?:    string;
}
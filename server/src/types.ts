import { WebSocket } from "ws";

type Room = {
    id_host:        WebSocket;
    status:         boolean;
    creation_time:  number
    Players:        Player[];
}

type Player = {
    username:   string;
    ready:      boolean;
    id:         WebSocket;
}

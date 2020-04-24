import { Injectable, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  conn: any;

  constructor() {
    this.conn = new WebSocket('ws://localhost:9090');
    this.conn.onopen = function () {
      console.log("Connected to the signalling server")
    };
    this.conn.onerror = function (err) {
      console.log("Got error", err);
    };
  }

  listen() {
    return new Observable((subscriber) => {
      this.conn.onmessage = function (msg) {
        subscriber.next(msg.data);
      };
    })
  }

  send(connectedUser, message) {
    console.log(connectedUser, message)
    if (connectedUser != null) {
      message.name = connectedUser;
    }
    this.conn.send(JSON.stringify(message));
  }
}


// listen(eventName: string) {
//   console.log("listen event called :", eventName);
//   return new Observable((subscriber) => {
//     this.socket.on(eventName, (data) => {
//       subscriber.next(data);
//     })
//   });
// }

// switch (data.type) {
//   case "login":
//     chatcomponent.emit(data.success);
//     break;
//   //when somebody wants to call us 
//   case "offer":
//     chat.handleOffer(data.offer, data.name);
//     break;
//   case "answer":
//     chat.handleAnswer(data.answer);
//     break;
//   //when a remote peer sends an ice candidate to us 
//   case "candidate":
//     chat.handleCandidate(data.candidate);
//     break;
//   case "leave":
//     chat.handleLeave();
//     break;
//   default:
//     break;
// }

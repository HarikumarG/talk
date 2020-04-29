import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  conn: any;
  port = 9090;
  constructor(private toast: ToastrService) {
    this.conn = new WebSocket('ws://localhost:' + this.port);
    this.conn.onopen = function () {
      toast.success('Connected to the server', 'You can Login now !');
      console.log("Connected to the signalling server");
    };
    this.conn.onerror = function (err) {
      toast.error('Not connected to the server', 'Server is down !');
      console.log("Got error", err);
    };
  }
  //listen if server sends any message
  listen() {
    return new Observable((subscriber) => {
      this.conn.onmessage = function (msg) {
        subscriber.next(msg.data);
      };
    })
  }

  //send message to the server
  send(connectedUser, message) {
    if (connectedUser != null) {
      message.name = connectedUser;
    }
    this.conn.send(JSON.stringify(message));
  }
}
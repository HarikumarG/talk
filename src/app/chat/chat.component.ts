import { Component, OnInit, Renderer2, ElementRef } from '@angular/core';
import { WebsocketService } from '../websocket.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  calleeuser: any;
  configuration: any;
  yourConn: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  showcallpage: boolean;
  UserName: string;
  loginname: string;
  calleename: string;
  textmsg: string;
  showloginPage: boolean;
  dataChannelOptions: any;
  emojii: any;
  possibleEmojis: any;

  constructor(private socketservice: WebsocketService, private render: Renderer2, private eleref: ElementRef) {
    this.possibleEmojis = [
      '🐀', '🐁', '🐭', '🐹', '🐂', '🐃', '🐄', '🐮', '🐅', '🐆', '🐯', '🐇', '🐐', '🐑', '🐏', '🐴',
      '🐎', '🐱', '🐈', '🐰', '🐓', '🐔', '🐤', '🐣', '🐥', '🐦', '🐧', '🐘', '🐩', '🐕', '🐷', '🐖',
      '🐗', '🐫', '🐪', '🐶', '🐺', '🐻', '🐨', '🐼', '🐵', '🙈', '🙉', '🙊', '🐒', '🐉', '🐲', '🐊',
      '🐍', '🐢', '🐸', '🐋', '🐳', '🐬', '🐙', '🐟', '🐠', '🐡', '🐚', '🐌', '🐛', '🐜', '🐝', '🐞',
    ];
    this.configuration = {
      "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
    };
    this.dataChannelOptions = {
      reliable: true
    };
    this.yourConn = new RTCPeerConnection(this.configuration);
    this.yourConn.ondatachannel = this.handleChannelCallback;
    this.showloginPage = true;
    this.showcallpage = false;
    this.textmsg = ""
    this.emojii = this.randomEmoji();
  }

  randomEmoji() {
    var randomIndex = Math.floor(Math.random() * this.possibleEmojis.length);
    return this.possibleEmojis[randomIndex];
  }
  OnLogin() {
    this.UserName = this.loginname;
    if (this.UserName.length > 0) {
      this.socketservice.send(null, { type: "login", name: this.UserName });
    }
  }

  OnCall() {
    if (this.calleename.length > 0) {
      this.yourConn.createOffer().then(offer => {
        this.socketservice.send(this.calleename, { type: "offer", offer: offer });
        this.yourConn.setLocalDescription(offer);
        console.log("local desc setted and sent of offer");
      }).catch(error => alert('Error when creating offer'));
    }
  }

  Onhangup() {
    this.socketservice.send(this.calleename, { type: "leave" });
    this.handleLeave();
  }

  handleDataChannelOpen = function () {
    console.log("Data Channel is opened");
  }

  handleDataChannelMessageReceived = (event) => {
    console.log("message arrived");
    this.insertMessageToDOM(JSON.parse(event.data), false);
  }

  handleDataChannelError = function (error) {
    console.log("Error when creating data channel", error);
  }

  handleDataChannelClose = function () {
    console.log("Data channel is closed");
  }

  handleChannelCallback = event => {
    this.dataChannel = event.channel;
    this.dataChannel.onopen = this.handleDataChannelOpen;
    this.dataChannel.onmessage = this.handleDataChannelMessageReceived;
    this.dataChannel.onerror = this.handleDataChannelError;
    this.dataChannel.onclose = this.handleDataChannelClose;
  }

  handleLogin(success) {
    if (success === false) {
      alert('Oops...try a different name');

    } else {
      this.showloginPage = false;
      this.showcallpage = true;
      this.yourConn.onicecandidate = event => {
        console.log("ice called");
        if (event.candidate) {
          this.socketservice.send(this.calleename, { type: "candidate", candidate: event.candidate });
          console.log("ice candidate sended");
        }
      }
      this.dataChannel = this.yourConn.createDataChannel("channel1", this.dataChannelOptions);
      this.dataChannel.onerror = this.handleDataChannelError;
      this.dataChannel.onmessage = this.handleDataChannelMessageReceived;
      this.dataChannel.onclose = this.handleDataChannelClose;
      this.dataChannel.onopen = this.handleDataChannelOpen;
    }
  }

  handleOffer(offer, name) {
    console.log("handle offer", offer, name);
    this.calleename = name;
    this.yourConn.setRemoteDescription(new RTCSessionDescription(offer));
    this.yourConn.createAnswer().then(answer => {
      this.yourConn.setLocalDescription(answer);
      this.socketservice.send(name, { type: "answer", answer: answer });
      console.log("local desc setted and sent of answer");
    }).catch(error => alert('Error when creating answer'));

  }
  handleAnswer(answer) {
    this.yourConn.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("handle answer and remote desc setted");
  }
  handleCandidate(candidate) {
    console.log("ice added");
    this.yourConn.addIceCandidate(new RTCIceCandidate(candidate));
  }

  handleLeave() {
    this.calleename = null;
    this.yourConn.close();
    this.yourConn.onicecandidate = null;
  }

  Sendmsg() {
    var val = this.textmsg;
    if (val.length > 0 && this.dataChannel.readyState === "open") {
      const data = {
        name: this.UserName,
        content: val,
        emoji: this.emojii
      };
      this.textmsg = "";
      this.dataChannel.send(JSON.stringify(data));
      this.insertMessageToDOM(data, true);
    }
  }

  insertMessageToDOM(options, isFromMe) {
    console.log("Dom msg insert", options, isFromMe);
    const chatArea = this.eleref.nativeElement.querySelector("#msgs");
    this.render.addClass(chatArea, 'overflow-auto');
    let message = this.render.createElement('div');
    this.render.addClass(message, 'message');
    if (isFromMe) {
      this.render.addClass(message, 'message--mine');
    } else {
      this.render.addClass(message, 'message--theirs');
    }
    let nameEl = this.render.createElement('div');
    this.render.addClass(nameEl, 'message__name');
    this.render.appendChild(nameEl, this.render.createText(options.emoji + " " + options.name));
    let nameCon = this.render.createElement('div');
    this.render.addClass(nameCon, 'message__bubble');
    this.render.appendChild(nameCon, this.render.createText(options.content));
    this.render.appendChild(message, nameEl);
    this.render.appendChild(message, nameCon);
    this.render.appendChild(chatArea, message);
  }
  ngOnInit() {
    this.socketservice.listen().subscribe((msg: any) => {
      console.log("Got message ", msg);
      var data = JSON.parse(msg);
      switch (data.type) {
        case "login":
          this.handleLogin(data.success);
          break;
        //when somebody wants to call us 
        case "offer":
          this.handleOffer(data.offer, data.name);
          break;
        case "answer":
          this.handleAnswer(data.answer);
          break;
        //when a remote peer sends an ice candidate to us 
        case "candidate":
          this.handleCandidate(data.candidate);
          break;
        case "leave":
          this.handleLeave();
          break;
        default:
          break;
      }
    });
  }


}


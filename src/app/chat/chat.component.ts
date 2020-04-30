import { Component, OnInit, Renderer2, ElementRef } from '@angular/core';
import { WebsocketService } from '../websocket.service';
import { ToastrService } from 'ngx-toastr';
import { DatePipe } from '@angular/common';
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
  otherpeername: string;
  disconnect: any;
  send: any;
  connect: any;
  c = 0;
  d = 0;
  date: number;
  time: any;
  hangup: boolean;
  constructor(private socketservice: WebsocketService, private render: Renderer2, private eleref: ElementRef, private toast: ToastrService) {
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
    this.showloginPage = true;
    this.showcallpage = false;
    this.textmsg = ""
    this.emojii = this.randomEmoji();
    this.disconnect = true;
    this.send = true;
    this.connect = false;
    const datepipe = new DatePipe('en-US');
    setInterval(() => {
      this.date = Date.now();
      this.time = datepipe.transform(this.date, 'shortTime');
    }, 1000);
  }

  randomEmoji() {
    var randomIndex = Math.floor(Math.random() * this.possibleEmojis.length);
    return this.possibleEmojis[randomIndex];
  }

  OnLogin() {
    this.UserName = this.loginname;
    if (this.UserName != undefined) {
      this.socketservice.send(null, { type: "login", name: this.UserName });
    } else {
      console.log("User name is empty");
      this.toast.error('Enter a unique user name', 'User Name is empty');
    }
  }

  OnCall() {
    if (this.calleename != undefined) {
      if (this.calleename != this.UserName) {
        this.yourConn.createOffer().then(offer => {
          this.socketservice.send(this.calleename, { type: "offer", offer: offer });
          this.yourConn.setLocalDescription(offer);
          this.otherpeername = this.calleename;
          this.disconnect = false;
          this.send = false;
          this.connect = true;
          this.toast.info('If callee logged in you will be connected', 'Calling ' + this.otherpeername + '..');
          console.log("local desc setted and offer is sent");
        }).catch(error => {
          console.log("Error when creating offer", error);
          alert('Error when calling, Reload and try again');
        });
      } else {
        this.toast.error('You cannot call yourself', 'Invalid Callee name !')
      }
    } else {
      this.toast.error('Enter the callee name', 'Callee name is empty !');
    }
  }

  Onhangup() {
    this.hangup = true;
    this.socketservice.send(this.calleename, { type: "leave" });
    this.socketservice.send(this.UserName, { type: "leave" });
  }

  OnClear() {
    document.getElementById("messages").textContent = '';
  }

  success() {
    this.toast.success('You are connected to ' + this.otherpeername, 'Connected !', {
      timeOut: 4000
    });
  }

  disconnection() {
    this.toast.error('', 'Successfully Disconnected !', {
      timeOut: 4000
    });
    this.otherpeername = "";
  }

  handleDataChannelOpen = () => {
    this.c++;
    if (this.c == 2) {
      this.success();
      this.c = 0;
    }
    console.log("Data Channel is opened");
  }

  handleDataChannelMessageReceived = (event) => {
    console.log("message arrived");
    this.insertMessageToDOM(JSON.parse(event.data), false);
  }

  handleDataChannelError = function (error) {
    console.log("Error when creating data channel", error);
  }

  handleDataChannelClose = () => {
    this.d++;
    if (this.d == 2) {
      this.disconnection();
      this.d = 0;
    }
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
      this.toast.error('Sorry user name is already taken', 'Try different user name !');
    } else {
      this.hangup = false;
      this.showloginPage = false;
      this.showcallpage = true;
      this.yourConn = new RTCPeerConnection(this.configuration);
      this.yourConn.ondatachannel = this.handleChannelCallback;
      this.yourConn.onicecandidate = event => {
        if (event.candidate) {
          this.socketservice.send(this.calleename, { type: "candidate", candidate: event.candidate });
          console.log("ice candidate sent");
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
    this.calleename = name;
    this.yourConn.setRemoteDescription(new RTCSessionDescription(offer));
    this.yourConn.createAnswer().then(answer => {
      this.yourConn.setLocalDescription(answer);
      this.socketservice.send(name, { type: "answer", answer: answer });
      this.otherpeername = this.calleename;
      this.disconnect = false;
      this.send = false;
      this.connect = true;
      this.toast.info('You will be connected', 'Answering to ' + this.otherpeername + '..')
      console.log("local desc setted and answer is sent");
    }).catch(error => {
      console.log("Error when creating answer", error);
      alert('Error when answering, Reload and ask your partner to call again');
    });
  }

  handleAnswer(answer) {
    this.yourConn.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("Remote desc is set");
  }

  handleCandidate(candidate) {
    console.log("ice added");
    this.yourConn.addIceCandidate(new RTCIceCandidate(candidate));
  }

  handleLeave() {
    this.calleename = null;
    this.connect = false;
    this.disconnect = true;
    this.send = true;
    this.yourConn.close();
    this.handleLogin(true);
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
    const chatArea = this.eleref.nativeElement.querySelector("#messages");
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
    let timeEl = this.render.createElement('small');
    this.render.addClass(timeEl, 'form-text');
    this.render.addClass(timeEl, 'time');
    this.render.appendChild(timeEl, this.render.createText(this.time));
    let nameCon = this.render.createElement('div');
    this.render.addClass(nameCon, 'message__bubble');
    this.render.appendChild(nameCon, this.render.createText(options.content));
    this.render.appendChild(nameCon, timeEl);
    this.render.appendChild(message, nameEl);
    this.render.appendChild(message, nameCon);
    this.render.appendChild(chatArea, message);
    chatArea.scrollTop = chatArea.scrollHeight - chatArea.clientHeight;
  }

  ngOnInit() {
    this.socketservice.listen().subscribe((msg: any) => {
      console.log("Got message from the server");
      var data = JSON.parse(msg);
      switch (data.type) {
        case "login":
          this.handleLogin(data.success);
          break;
        //when somebody wants to call us 
        case "offer":
          this.handleOffer(data.offer, data.name);
          break;
        //when somebody wants to answer
        case "answer":
          this.handleAnswer(data.answer);
          break;
        //when a remote peer sends an ice candidate to us 
        case "candidate":
          this.handleCandidate(data.candidate);
          break;
        //when partner leaves
        case "leave":
          if (this.hangup == false) {
            this.toast.info('Your partner disconnected', 'Disconnecting from ' + this.otherpeername + '..');
          }
          this.handleLeave();
          break;
        //when calling if no such user logged in
        case "nouser":
          this.toast.error('No such user is logged in..', 'Invalid user name !');
          this.calleename = null;
          this.connect = false;
          this.disconnect = true;
          this.send = true;
          this.otherpeername = "";
          this.handleLogin(true);
          break;
        case "busy":
          //when partner is already busy
          this.toast.info('Your partner ' + this.otherpeername + ' is busy', 'Busy !');
          this.calleename = null;
          this.connect = false;
          this.disconnect = true;
          this.send = true;
          this.otherpeername = "";
          this.handleLogin(true);
          break;
        default:
          break;
      }
    });
  }
}


# Talk

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.0.0.

## Development server

The project is deployed in the heroku where you can find the working model.
https://chit-chat-in.herokuapp.com/

# Description

This app is based on WebRTC concept which helps to chat with another peer without sending message packet to the server. It directly connects one peer to another peer.

For this app to work fine, A web server is required which has websocket to connect to the peers for sending sdp's and ICEcandidates to each other ie. between peers.
This web server is also deployed in heroku.

# Local Deployment

For local deployment just git clone this repository and Run `npm install` and Run `npm start` if this command throws error the run `ng serve` this command should work fine.


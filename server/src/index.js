import env from 'dotenv'
import express from 'express'
import mongoose from "mongoose";
import { Server } from 'socket.io'

import {
  createGame,
  joinGame,
  websocketHandler
} from './game.controller.js'

import {
  actionTypes,
  connectToDb
} from './uitls.js'



async function main() {
  try {
    env.config()
    const app = express()

    app.use(express.json())
    connectToDb(process.env.DATABASE_URI)
    
    const port = process.env.PORT || 5050

    app.put('/createGame', createGame)
    app.post('/joinGame', joinGame)


    const server = app.listen(port, () => {
      console.log(`app is running at ${port}`)
    })

    const io = new Server(server)
    
    io.on('connection', (socket) => { 
  
      websocketHandler(io, socket)
    });

  } catch(error) {
    console.log(error);
    
  }

}

main()

   
import * as readline from 'readline';
import { stdin as input, stdout as output } from 'process';
import axios from 'axios';
import { io } from "socket.io-client";

const host = "localhost:5055";
const httpBaseUrl = `http://${host}/`;
const wsBaseUrl = `ws://${host}`;

export const roomActions = {
  createRoom: 'CREATE_ROOM',
  joinRoom: 'JOIN_ROOM',
}

const listenerEvents =  {
  next: 'NextMove',
  left : 'opponentLeft',
  win: 'win',
  matchTied: 'tied',
  game: 'game',
  error: 'errorMessage'
}

const emitEvents = {
  move: 'move'
}

const red =  "\x1b[31m"
const normal = "\x1b[0m"
const green  = "\x1b[42m"


export async function startGame(state) {
  try {
  
    console.log('connecting.....')

    const auth =   JSON.stringify({
        gameId: state.gameData._id,
        playerId: state.gameData.playerId,
    })

    const socket = io(wsBaseUrl, {
      extraHeaders: {
        Authorization: auth,
      }
    });

    socket.on('connect', async function() {

      console.log('connected')


      socket.on(listenerEvents.next, async(data) => {
      
        if(state.gameData.playerId === data.id) {

          console.log('take its your move')

          const move = await nextMove()

          socket.emit(emitEvents.move, move)
        } else {
          
          console.log(`${data.name} is taking his move ...`)
        }
      })  

      socket.on(listenerEvents.win, (id) => {
        if(state.gameData.playerId === id) {

          console.log(green,'you win this game', normal)

          rl.close()

        } else {
          
          console.log(red, `you lose this game`, normal)
          rl.close()

        }
      })

      socket.on(listenerEvents.left, (data) => {
        if(state.gameData.playerId != data.id) {

          console.log(green,`you win the game ${data.name} left this game`, normal)
        

        } else {
          console.log('you left game')
        }

        rl.close()

      })

      socket.on(listenerEvents.matchTied, () => {

        console.log(green,`game tied...`, normal)
        rl.close()
        
      })

      socket.on(listenerEvents.game, (data) => {

        console.log(data)
        
      })

      socket.on(listenerEvents.error, (data) => {
        if(state.gameData.playerId === data.id) {

          console.log(data.error)
        }
      })
      
    });
  } catch(error) {
    console.log(error)
  }
}




const rl = readline.createInterface({ input, output });

export const makeRequest = (endPoint, data, requestMethod) => {

 return new Promise((resolve, reject) => {
   console.log(`${httpBaseUrl}${endPoint}/`);

    axios(`${httpBaseUrl}${endPoint}/`, {
      method: requestMethod,
      data
    })
    .then(res =>{
      resolve({
        data: res.data,
        success: true
      })
    }) 
    .catch((error) => {
      
      if (error.response && error.response.data) {
        resolve({
          data: error.response.data,
          success: false
        })
      } 
      else {
        reject(error.message)
      }
    });
  });

}

export async function setUpGame() {

  return new Promise(async(resolve) => {
    let action 
    // to get valid input of acton
    while (!action) {

      let actionType = await question('press 1 to create room or press 2 to join room:-  ')

      if (['1', '2'].includes(actionType)) {
        
        action = actionType === '1' 
          ? roomActions.createRoom
          : roomActions.joinRoom

          resolve(action)
          break;
      } else {

        console.log('invalid input please try again')
      }
      
    }

  }) 
}

export async function nextMove() {

  return new Promise(async(resolve) => {

    // to get valid input of acton
    while (true) {

      let newMove = await question('Please enter move from 0 - 8 or select \' r \'  to leave:- ')
        console.log(newMove)
      if (newMove === 'r') {
        resolve(newMove)
        break;
      }

      let number = parseInt(newMove) || 0

      if (number !== NaN && number > -1 && number < 9) {

        resolve(newMove)

        break;
      } else {

        console.log('invalid move')
      }
      
    }

  }) 
}

export async function getPlayerName() {

  return new Promise(async(resolve) => {
    let name
    // to get valid input of acton
    while (!name) {

      let name = await question('please enter your name:-  ')

      if (name) {

        return resolve(name)
      } else {

        console.log('Please enter valid name')
      }
      
    }

  }) 
}


export async function createRoom(state) {

  return new Promise(async(resolve) => {
    
    while (!Object.keys(state.gameData).length) {

      let room = await question('enter name of room:- ')

      if (!room) {
        console.log('please insert valid room name')

        continue
      }

      try {
        console.log('making request ...')

        let response = await makeRequest(
          'createGame', 
          {
            playerName: state.playerName,
            roomName: room
          },
          'put'
        )
    
        if (response.success) {
    
          state.gameData = response.data
          
          return resolve()
        }
    
        console.log(red, response.data.join('\n'), normal)
      } catch(error) {
    
        console.log(error)
      }
    }

  }) 
}

export async function joinRoom(state) {

  return new Promise(async(resolve) => {
    // to get valid input of acton
    while (!Object.keys(state.gameData).length) {

      let room = await question('Please enter room Name you want to join :- ')
      
      if (!room) {
        console.log('please insert valid room name')
      }

      try {
        console.log('making request ...')

        let response = await makeRequest(
          'joinGame', 
          {
            playerName: state.playerName,
            roomName: room
          },
          'post'
        )
          
        if (response.success) {
    
          state.gameData = response.data
           return resolve()
           
        }
    
        console.log(red, response.data.join('\n'), normal)
      } catch(error) {
    
        console.log(error)
      }
    }

  }) 
}

 
export function question(theQuestion) {
  return new Promise(resolve => rl.question(theQuestion, answer => {
    resolve(answer)
  }))
}
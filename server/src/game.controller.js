import GameModal from "./game.schema.js";
import { v4 } from "uuid";
import { sendResponse } from "./uitls.js";
import _ from 'lodash'
const emitEvents =  {
  next: 'NextMove',
  left : 'opponentLeft',
  win: 'win',
  matchTied: 'tied',
  game: 'game',
  error: 'errorMessage'
}

const listenerEvents = {
  move: 'move'
}

export const createGame = async (req, res) => {
  try {
    const { playerName, roomName } = req.body;

    const errors = [];

    if (!playerName) {
      errors.push("Please enter player1 name");
    }

    if (!roomName) {
      errors.push("Please enter room name");
    }

    if (errors.length) {
      return sendResponse(res, errors, 400);
    }

    const room = await GameModal.findOne({
      roomName: roomName,
    });

    console.log(room);

    if (room) {
      return sendResponse(res, ["another room with same name is active"], 400);
    }

    const result = await new GameModal({
      player1Name: req.body.playerName,
      idPlayer1: v4(),
      roomName,
    }).save();

    res.send({
      playerId: result.idPlayer1,
      _id: result._id,
    });
  } catch (error) {
    console.log(error.message);
    sendResponse(res, error.message, 500);
  }
};

export const joinGame = async (req, res) => {
  try {
    const { playerName, roomName } = req.body;
    console.log(req.body);
    const errors = [];

    if (!playerName) {
      errors.push("Please enter player2 name");
    }

    if (!roomName) {
      errors.push("Please room name you want to join");
    }

    // if got one of above errors then send those error and return
    if (errors.length) {
      return sendResponse(res, errors, 400);
    }

    const game = await GameModal.findOne({
      roomName: roomName,
    });

    console.log(game);
    //checking room exist or not
    if (!game) {
      return sendResponse(res, ["room not found"], 404);
    }

    if (game.idPlayer2) {
      return sendResponse(res, ["room is full try to  create another"], 400);
    }

    const result = await GameModal.findByIdAndUpdate(
      game._id,
      {
        player2Name: playerName,
        idPlayer2: v4(),
      },
      { new: true }
    );

    return sendResponse(res, {
      playerId: result.idPlayer2,
      _id: result._id,
    });
  } catch (error) {
    console.log(error);
    sendResponse(res, error.message, 500);
  }
};

function isSame(game, indexes) {
  console.log(indexes)
 let condition = indexes.every(index => game[index] === game[indexes[0]])
 console.log(condition)
  return condition && game[indexes[0]] != null ? game[indexes[0]] : false
}

const moveHandler = async(io, move, gameAuth) => {
  try {

    const currentGameData =  await GameModal.findById(gameAuth.gameId)
    const game = currentGameData.game

    if (move === 'r') {
      io.emit(emitEvents.left,{
        id: gameAuth.playerId,
        name: currentGameData.idPlayer1 === gameAuth.playerId 
          ? currentGameData.player1Name
          : currentGameData.player2Name
      })

      return
    }

    if (game[move] != null) {
      io.emit(emitEvents.error, {
        id: gameAuth.playerId,
        error: 'move is already taken'
      })

      let nextMove = {
        id: currentGameData.idPlayer1 === gameAuth.playerId
          ? currentGameData.idPlayer1
          : currentGameData.idPlayer2,
        name: currentGameData.idPlayer1 === gameAuth.playerId
          ? currentGameData.player1Name 
          : currentGameData.player2Name
      }

      io.emit(emitEvents.next, nextMove)

      
      return
    }
    
    if (currentGameData.idPlayer1 === gameAuth.playerId) {
      game[move] = 'x'
    } else {
      game[move] = '0'
    }

    await GameModal.findByIdAndUpdate(
      gameAuth.gameId,
      {
        game: game
      }
    )
    
    let winner = isSame(game, [0,1,2]) 
      || isSame(game, [3,4,5]) 
      || isSame(game, [6,7,8])
      || isSame(game, [0,4,8])
      || isSame(game, [2,4,6])
      || isSame(game, [0,3,6])
      || isSame(game, [1,4,7])
      || isSame(game, [2,5,8])

      io.to(gameAuth.gameId).emit(emitEvents.game, game)
      
      if (winner) {
        winner === '0'
          ? io.emit(emitEvents.win, currentGameData.idPlayer2)
          : io.emit(emitEvents.win, currentGameData.idPlayer1)

        return
      }

      let isTied = game.filter(Boolean).length === 9

      if (isTied) {
        io.emit(emitEvents.matchTied, '')
        return
      }

      let nextMoveData = {
        id: currentGameData.idPlayer1 === gameAuth.playerId
          ? currentGameData.idPlayer2
          : currentGameData.idPlayer1,
        name: currentGameData.idPlayer1 === gameAuth.playerId
          ? currentGameData.player2Name
          : currentGameData.player1Name
      }

      io.emit(emitEvents.next, nextMoveData)
  }catch (error) {
    console.log(error)
  }


}

export const websocketHandler = async(io, socket) => {
  const gameAuth = JSON.parse(socket.request.headers.authorization)
  socket.join(gameAuth.gameId);
    const currentGameData =  await GameModal.findById(gameAuth.gameId)
    

    if (currentGameData.idPlayer2 === gameAuth.playerId && !currentGameData.game.filter(Boolean).length ) {
      
      io.emit(
        emitEvents.next,
        {
          id: currentGameData.idPlayer1,
          name: currentGameData.player1Name
        }
      )
    }

  socket.on(listenerEvents.move, async(move) => {
  
    moveHandler(io, move, gameAuth)
  })


  socket.on('disconnect', async(move) => {
  
    GameModal.deleteOne({_id: gameAuth.gameId})
  })
}
import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  player1Name: {
    type: String
  },

  player2Name: {
    type: String
  },

  idPlayer1: {
    type: String,
  },

  idPlayer2: {
    type: String,
  },

  roomName: {
    type: String,
    unique: true
  },

  lastMoveBy: {
    type: String
  },

  game: {
    type: [String],
    default: [
      null, null, null,
      null, null, null,
      null, null, null
    ]
  }
})

 const GameModal =  mongoose.model('GameModal', schema)

 export default GameModal
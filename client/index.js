import WebSocket from 'ws';

import {
  setUpGame,
  getPlayerName,
  createRoom,
  roomActions,
  joinRoom,
  startGame
 } from './utils.js';



const state =  {
  gameData: {},
  roomAction: '',
  playerName: ''
}





async function main() {
 
  state.roomAction =  await setUpGame()
  state.playerName = await getPlayerName()

  if (state.roomAction === roomActions.createRoom) {
    await createRoom(state)
  }

  if (state.roomAction === roomActions.joinRoom) {
    await joinRoom(state)
  }

  startGame(state)
}

main()
import mongoose from "mongoose";

export const actionTypes = {
  create_game: "CREATE_GAME",
  move: "MOVE",
};

export const connectToDb = (uri) => {
  return mongoose.connect(
    uri,
    {
      useNewUrlParser: true,
    },
    (error) => { 
      if (error) {
        console.log(error)
      }

      console.log(`database connected...`);
    }
  );
};

export const sendResponse = (res, data, resStatus = 200) => {
  res
    .status(resStatus)
    .send(data);
};

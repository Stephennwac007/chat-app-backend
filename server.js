// importing all stuffs
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

// app config
const app = express();
const port = process.env.PORT || 3001;

//pusher instance
const pusher = new Pusher({
  appId: "1198484",
  key: "4d9205b9927610e9d1d9",
  secret: "3096f76c95643223aec4",
  cluster: "eu",
  useTLS: true,
});

//middlewares
app.use(express.json());
app.use(cors());

// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*')
//     res.setHeader('Access-Control-Allow-Headers', '*')
//     next()
// })

//database
const connection_url =
  "mongodb+srv://admin:Vnw7Xc8$zDrnPVB@cluster0.0f5vs.mongodb.net/chatappdb?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});
//implementing change stream
const db = mongoose.connection;

db.once("open", () => {
  console.log("connected to db!!");

  const msgCollection = db.collection("messagecontents"); //consistency on the dbname
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log("A change occurred", change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error triggering Pusher!");
    }
  });
});

//????

//api routes
app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

//listen
app.listen(port, () => console.log(`listening on port ${port}`));

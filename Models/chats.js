const mongoose = require('mongoose'); 
mongoose.Promise = global.Promise; 
const Schema = mongoose.Schema;

//creating user schema to register an user
const chatSchema = new Schema({
  sender:{type:String,required:true},
  receiver:{type:String,required:true},
  senderImage: { type: String,required:true},
  isDelivered: {type: Boolean,default: false},
  timestamp: {type: Date,default: new Date()},
  isSeen:{type: Boolean,default: false},
  message:{type:String}
});

///exporting module
module.exports = mongoose.model('Chat', chatSchema,'chats');
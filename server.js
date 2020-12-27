const express=require('express');
const bodyParser=require('body-parser');
const morgan=require('morgan');
const cors=require("cors");
const compression = require('compression');
const config = require('./config/config')
const mongoose=require('mongoose');
const jwt = require("jsonwebtoken");
const router=express.Router();
const User = require('./Models/user')
var colors = require('colors/safe');
const Chat = require('./Models/chats')

const auth=require('./Routes/authentication')(router)

mongoose.connect(config.uri,{ useNewUrlParser: true,useFindAndModify: false,useCreateIndex: true,useUnifiedTopology:true },(dberror)=>{
    if(dberror){
        console.log("Cannot connect to Database "+config.db);
    }
    else{
        console.log("Connected to database "+config.db);
    }
});

const app=express()
var socketObj={}

var server=require('http').createServer(app)
server.listen(config.port, function () 
{
    console.log('App listening on port '+config.port+'!');
});

var io = require('socket.io').listen(server);

app.use(compression());
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json({limit: "50mb"}));
app.use(express.static(__dirname));

io.use((socket, next) => {
    // return next(new Error('Session Expired.Please Login Again'));
    //return next();
    const token=socket.handshake.headers['x-clientid'];
    if(!token){
        return next(new Error("Authorization Failed!!"));
    }
    else{
        jwt.verify(token, config.secret, (error, decoded) => { 
            if (error) {
                return next(new Error('session_expired'));
            } 
            else if(socketObj[decoded.usercode]){
                //socket.emit('duplicate_tab',"Duplicate Tab")
                return next(new Error('duplicate_tab'));
            }
            else{
              return next();
            }
        });
    }
    // let token = socket.handshake.query.token;
});

io.on('connection', (socket) => {
    //console.log("New User Connected "+socket.id)
    const token=socket.handshake.headers['x-clientid'];
    // ...
    // setTimeout(() => {
    //     socket.disconnect()
    // }, 5000);
    jwt.verify(token, config.secret, (error, decoded) => { 
        if (error) {
            socket.disconnect(error)
        } 
        else {
            socket['token']=decoded
            socketObj[decoded.usercode]=socket
            makeOnlineUser(decoded,socket.id)
            socket.broadcast.emit('user_connected',{usercode:socket.token.usercode,socket:socket.id})
            getUndeliveredMessageCount(decoded.usercode,(res)=>{
                if(res.success){
                    if(res.data.length){
                        socket.emit("bulk_message_received",res.data)
                        for(let d of res.data){
                            if(socketObj[d._id] && socketObj[d._id].id){
                                socket.broadcast.to(socketObj[d._id].id).emit('pending_message_delivered',{usercode:decoded.usercode})
                            }
                        }
                        markMessageDelivered(decoded.usercode)
                    }
                }
                else{
                    console.log(colors.red(res.message))
                }
            })
        }
    });
    socket.on('disconnect', () => {
        //console.log('User disconnected...'+socket.id);
        io.sockets.emit('user_disconnected',{usercode:socket.token.usercode})
        makeOfflineUser(socket.token)
        delete socketObj[socket.token.usercode]
    });

    socket.on('message',(data)=>{
        let obj={
            sender:socket.token.usercode,
            receiver:data.usercode,
            senderImage: socket.token.image,
            message:data.message,
            timestamp:new Date(),
            isDelivered:socketObj[data.usercode] && socketObj[data.usercode].id?true:false
        }
        addChat(obj,(send)=>{
            if(send){
                if(socketObj[data.usercode] && socketObj[data.usercode].id){
                    socket.broadcast.to(socketObj[data.usercode].id).emit('message_received',obj)
                }
                socket.emit('message_delivered',{message:"Message Delivered",isDelivered:obj.isDelivered})
            }
            else{
                socket.emit('message_failed',{message:"Message Sending failed"})
            }
        })
    })

    socket.on('user_message_seen',(data)=>{
        markMessagesSeen(data.usercode,socket.token.usercode)
        if(socketObj[data.usercode] && socketObj[data.usercode].id)
            socket.broadcast.to(socketObj[data.usercode].id).emit('message_seen',{usercode:socket.token.usercode})
    })
});

app.use("/api/authentication",auth)

app.use('*',(request,response)=>{
    response.sendFile(__dirname+'/index.html')
})

app.use((request,response,next)=>
{
  const error=new Error("Cannot Serve "+request.method+" Request from "+request.url);
  error.status=200;
  next(error);
});

app.use((error,request,response,next)=>{
    response.status(error.status||500).json({success:false,error:error.message})
})

const makeOnlineUser = (user,socketID) =>{
    User.updateOne({usercode:user.usercode},{$set:{online:true,socketId:socketID},$unset:{lastSeen:true}})
    .then((result)=>{
        if(result.nModified){
            //console.log(colors.green(`${user.name} is online now`))
        }
        else{
            console.log(colors.red(`${user.name} is failed to online`))
        }
    })
    .catch((error)=>{
        console.log(colors.red("Error in Online "+error.message))
    })
}

const makeOfflineUser = (user) =>{
    User.updateOne({usercode:user.usercode},{$set:{online:false,lastSeen:new Date()},$unset:{socketId:true}})
    .then((result)=>{
        if(result.nModified){
            //console.log(colors.yellow(`${user.name} is offline now`))
        }
        else{
            console.log(colors.red(`${user.name} is failed to offline`))
        }
    })
    .catch((error)=>{
        console.log(colors.red("Error in Offline "+error.message))
    })
}

const addChat = (data,callback) =>{
    let chat=new Chat(data)
    chat.save().then((result)=>{
        if(result){
            //console.log(colors.green("Message saved."))
            callback(true)
        }
        else{
            console.log(colors.red("Failed to save message."))
            callback(false)
        }
    })
    .catch((error)=>{
        console.log(colors.red(error.message))
        callback(false)
    })
}

const markMessagesSeen = (sender,receiver) =>{
    Chat.updateMany({sender,receiver,isSeen:false},{$set:{isSeen:true}})
    .then((result)=>{
        if(result.nModified==result.n){
            //console.log(colors.yellow(`${user.name} is offline now`))
        }
        else{
            console.log(colors.red(`Failed to update message seen`))
        }
    })
    .catch((error)=>{
        console.log(colors.red(`Failed to update message seen`))
    })
}

const getUndeliveredMessageCount = (receiver,callback) =>{
    Chat.aggregate([
        {$match:{receiver,isSeen:false}},
        {$group : {_id : "$sender", message_count : {$sum : 1}}}],
        (err, result) =>{
        if (err) {
            console.log("Error in counting undelivered message");
            callback({success:false,message:"Some error occured."})
        }
        else{
            callback({success:true,message:"success.",data:result})
        }
    })
}

const markMessageDelivered = (receiver) =>{
    Chat.updateMany({receiver,isDelivered:false},{$set:{isDelivered:true}})
    .then((result)=>{
        if(result.nModified==result.n){
            //console.log(colors.yellow(`${user.name} is offline now`))
        }
        else{
            console.log(colors.red(`Failed to update message delivered`))
        }
    })
    .catch((error)=>{
        console.log(colors.red(`Failed to update message delivered`))
    })
}
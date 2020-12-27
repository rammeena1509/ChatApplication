const Counter = require('./../Modules/counter')
const User = require('./../Models/user')
const Chat = require('./../Models/chats')
const Validation=require('./../Modules/validation')
const jwt = require('jsonwebtoken')
const config = require('./../config/config')
const Auth=require('./../Modules/authorization')
const async = require("async")
var colors = require('colors/safe');
const moment =require('moment')
// moment.updateLocale('en', null);

module.exports=(router)=>{

    router.post("/login",(request,response)=>{
        if(!request.body.username){
            response.json({success:false,message:"Email/Mobile is required"})
        }
        else if(!request.body.password){
            response.json({success:false,message:"Password is required"})
        }
        else{
            User.findOne({ $or:[{email: request.body.username},{mobile: request.body.username}] }, (error, user) => {   
                if (error) {
                  response.json({ success: false, message: error.err });
                } 
                else{  
                  if (!user) 
                  {
                    response.json({ success: false, message: 'Mobile/Email is not registered.' });
                  } 
                  else{
                      if(user.isLoggedIn){
                        response.json({ success: false, message: 'You are logged in from another device.' });
                      }
                      else{
                          const validPassword = user.comparePassword(request.body.password); 
                          if (!validPassword) 
                          {
                              response.json({ success: false, message: 'Provided password is not valid.' }); 
                          } 
                          else{
                              if(user.isApproved){
                                  User.updateOne({ $or:[{email: request.body.username},{mobile: request.body.username}] },{$set:{isLoggedIn:true}}).exec().then(result=>{
                                    if(result.nModified){
                                        const token = jwt.sign(
                                            { 
                                                userId: user._id,
                                                usercode:user.usercode,
                                                name:user.name,
                                                email:user.email,
                                                role:user.role,
                                                mobile:user.mobile,
                                                image:user.image
                                            },
                                                config.secret
                                            ); 
                                        response.json({ success: true, message: 'Logged In Successfully', token:token}); 
                                    }
                                    else{
                                        response.json({ success: false, message: 'Some problem in logged in your account.', token:token});
                                    }
                                  })
                                  .catch(error=>{
                                    console.log("Error in login "+error.message)
                                    response.json({ success: false, message: 'Some problem in logged in your account.', token:token});
                                  })
                              }
                              else{
                                  response.json({ success: false, message: 'Your account approval is under process , we will notify when your account will get approved.'}); 
                              }
                          }
                      }
                  }
                }
              });
        }
    })

    router.post("/logout",Auth.check_auth,(request,response)=>{
        User.updateOne({usercode:request.decoded.usercode },{$set:{isLoggedIn:false}}).exec().then(result=>{
            if(result.nModified){
                response.json({ success: true, message: 'Logged Out Successfully'}); 
            }
            else{
                response.json({ success: false, message: 'Some problem in logged out your account.'});
            }
        })
        .catch(error=>{
        console.log("Error in login "+error.message)
        response.json({ success: false, message: 'Some problem in logged out your account.'});
        }) 
    })

    router.post("/register",(request,response)=>{
        if(!request.body.name || !Validation.nameValidity(request.body.name)){
            response.json({success:false,message:"Either name is not provided or invalid."})
        }
        else if(!request.body.email || !Validation.emailValidity(request.body.email)){
            response.json({success:false,message:"Either email is not provided or invalid."})
        }
        else if(!request.body.mobile || !Validation.mobileValidity(request.body.mobile)){
            response.json({success:false,message:"Either mobile is not provided or invalid."})
        }
        else if(!request.body.password){
            response.json({success:false,message:"Password is not provided."})
        }
        else if(!request.body.role){
            response.json({success:false,message:"Provide the user role."})
        }
        else{
            Counter.sequenceCounter('user',(id)=>{
                if(id){
                    let usercode=request.body.email
                    usercode=usercode.substr(0,4)
                    if(usercode.includes('@')){
                        usercode=usercode.split('@')[0]
                        usercode=usercode.length==4?usercode:usercode.length<4?usercode+"9999".substr(0,4-usercode.length):usercode.substr(0,4)
                    }
                    usercode=usercode.toUpperCase()+id
                    let user=new User({
                        role:request.body.role,
                        name:request.body.name,
                        email: request.body.email.trim().toLowerCase(),
                        password: request.body.password,
                        usercode:usercode,
                        image:request.body.image,
                        mobile:request.body.mobile.trim()
                    })
                    user.save().then(result=>{
                        if(result){
                            response.json({success:true,message:"Account registered successfully.We will notify you when your account is active.",usercode:usercode}) 
                        }
                        else{
                            response.json({success:false,message:"Failed to register account. Please try again later."}) 
                        }
                    })
                    .catch(error=>{
                        if(error.code==11000){
                            if(error.message.includes('mobile')){
                                response.json({success:false,message:"Mobile number already registered."}) 
                            }
                            else if(error.message.includes('email')){
                                response.json({success:false,message:"Email already registered."}) 
                            }
                            else if(error.message.includes('usercode')){
                                response.json({success:false,message:"Some error in generating usercode.Please try again later."}) 
                            }
                            else{
                                console.log("Error 1 : "+error.message)
                                response.json({success:false,message:"Some error occured.Please try again later."}) 
                            }
                        }
                        else{
                            console.log("Error 1 : "+error.message)
                            response.json({success:false,message:"Some error occured.Please try again later."}) 
                        }
                    })
                }
                else{
                    response.json({success:false,message:"Some error occured.Please try again later."}) 
                }
            })
        }
    })

    router.post("/userList",Auth.check_auth,(request,response)=>{
        let projection="name usercode lastSeen socketId online image"
        if(request.decoded.role=='admin'){
            projection+="email mobile creationDate isApproved role"
        }
        User.find({role:'user',usercode:{$ne:request.decoded.usercode}},{_id:false}).sort({online:-1}).select(projection).exec().then((users)=>{
            if(users.length>0){
                response.json({success:true,message:"User list fetched successfully.",data:users})
            }
            else{
                response.json({success:false,message:"No user found."})
            }
        })
        .catch((error)=>{
            console.log("Error /userList 01 "+error.message)
            response.json({success:false,message:"Some error ocuured.Please try again later."})
        })
    })

    router.post("/chatsList",Auth.check_auth,(request,response)=>{
        if(!request.body.usercode){
            response.json({success:false,message:"Usercode is required."})
        }
        else{
            Chat.find({$or:[{sender:request.decoded.usercode,receiver:request.body.usercode},{sender:request.body.usercode,receiver:request.decoded.usercode}]})
            .sort({timestamp:-1}).limit(50).exec()
            .then((chats)=>{
                if(chats){
                    response.json({success:true,message:"Chat list fetched successfully.",data:chats.reverse()})
                }
                else{
                    response.json({success:false,message:"No chat found."})
                }
            })
            .catch((error)=>{
                console.log("Error /userList 01 "+error.message)
                response.json({success:false,message:"Some error ocuured.Please try again later."})
            })
        }
    })

    router.post("/addChat",Auth.check_auth,(request,response)=>{
        if(!request.body.usercode){
            response.json({success:false,message:"Usercode is required."})
        }
        else if(!request.body.message){
            response.json({success:false,message:"Message is required."})
        }
        else{
            let chat=new Chat({
                sender:request.decoded.usercode,
                receiver:request.body.usercode,
                senderImage: request.decoded.image,
                message:request.body.message
            })
            chat.save().then((result)=>{
                if(result){
                    response.json({success:true,message:"Message sent successfully."})
                }
                else{
                    response.json({success:false,message:"Failed to send message."})
                }
            })
            .catch((error)=>{
                console.log("Error /addChat 02 "+error.message)
                response.json({success:false,message:"Some error ocuured.Please try again later."})
            })
        }
    })

    return router
}
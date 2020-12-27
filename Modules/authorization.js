const jwt = require("jsonwebtoken");
const config=require('./../config/config');

const check_auth=(request,response,next)=>{
    const token=request.headers['authorization'];
    if(!token){
        response.status(202).json({success:false,message:"Authorization Failed!!"})
    }
    else{
        jwt.verify(token, config.secret, (error, decoded) => { 
            if (error) {
              response.json({ success: false, message: 'Session Expired.Please Login Again'}); 
            } else {
              request.decoded = decoded; 
              next();
            }
          });
    }
}

module.exports={
    check_auth
}
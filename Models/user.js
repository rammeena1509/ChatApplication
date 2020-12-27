const mongoose = require('mongoose'); 
mongoose.Promise = global.Promise; 
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs'); 

//creating user schema to register an user
const userSchema = new Schema({
  role:{type:String,require:true},
  name:{type:String,require:true},
  email: { type: String, required: true,unique:true },
  image: { type: String},
  password: { type: String, required: true},
  usercode:{type:String,required:true,unique:true},
  mobile:{type:String,required:true,unique:true},
  isApproved: {type: Boolean,default: false},
  creationDate: {type: Date,default: new Date()},
  updationDate: {type: Date,default: new Date()},
  online:{type:Boolean,default:false},
  socketId:{type:String},
  lastSeen:{type:Date},
  isLoggedIn:{type:Boolean,default:false},
  deviceDetails:[]
});


////before save the user, please consider this constraint
userSchema.pre('save', function(next) {
  
  if (!this.isModified('password'))
    return next();

  bcrypt.hash(this.password, 10, (err, hash) => {
    if (err) return next(err); 
    this.password = hash; 
    next(); 
  });
});


//compare method to compare password which is in encypted form

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compareSync(password, this.password); 
};


///exporting module
module.exports = mongoose.model('User', userSchema,'users');
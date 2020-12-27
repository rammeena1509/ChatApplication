var mongoose = require('mongoose');
Schema = mongoose.Schema;
var counterID =new mongoose.Schema(
{
    _id: { type: String,default:"user" }, 
    seq:{ type: Number },
    type:{type:String,require:true}
});   
module.exports = mongoose.model('counter', counterID,'counter');
//var crypto= require('crypto').randomBytes(256).toString('hex');

var dbType = 'mongodb';
// var dbUrl = 'localhost';
var dbUrl = '<db_url>';
var dbPort = '<db_port>';
var dbName = '<db_name>';

module.exports=
{
    uri:dbType+'://'+dbUrl+':'+dbPort+'/'+dbName,
    secret: "<SECRET>",
    db: dbName,
    port:3200
}

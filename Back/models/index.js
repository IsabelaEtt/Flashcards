let dbSrv = "mongodb+srv://isaett:isa1234@cluster0.hlyzomw.mongodb.net/?retryWrites=true&w=majority";

const mongoose = require("mongoose");
const uriFormat = require('mongodb-uri');

const ObjectId = mongoose.Types.ObjectId;
mongoose.Promise = global.Promise;

const options = { 
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: false
};

function encodeMongoURI (urlString) {
    if (urlString) {
      let parsed = uriFormat.parse(urlString)
      urlString = uriFormat.format(parsed);
    }
    return urlString;
}

if (!global.mongooseConnection || (global.mongooseConnection && global.mongooseConnection.readyState == 0)) { 
    global.mongooseConnection = mongoose.createConnection(encodeMongoURI(dbSrv), options);
}

/* mongoose connection state:
    0: disconnected
    1: connected
    2: connecting
    3: disconnecting
 */

let User = global.mongooseConnection.model('User', require('./User'));
let Friendship = global.mongooseConnection.model('Friendship', require('./Friendship'));
let FlashCard = global.mongooseConnection.model('FlashCard', require('./FlashCard'));
let UserFlashCard = global.mongooseConnection.model('UserFlashCard', require('./UserFlashCard'));

module.exports = {
    User,
    Friendship,
    FlashCard,
    UserFlashCard,
    ObjectId
};
const mongoose = require('mongoose');
const Schema  = mongoose.Schema;

const userSchema = new Schema({
    user_id: {
        type:String,
    },
    pollId: {
        type:String,
    },
    vote: {
        type: String,
    },
    name:{
        type: String
    },
    surname:{
        type: String
    }
});

mongoose.model('user', userSchema);
const mongoose = require('mongoose');
const Schema  = mongoose.Schema;

const PollSchema = new Schema({
    image: {
        type: String,
    },
    headline: {
        type: String,
    },
    description:{
        type: String
    },
    videoLink:{
        type: String,
    },
    interlocutorLink:{
        type: String
    },
});

mongoose.model('poll', PollSchema);
let mongoose = require("mongoose");
let ObjectId = mongoose.Schema.ObjectId;

let FlashCardSchema = new mongoose.Schema({ 
    owner: {
        type: ObjectId,
        ref: "User",
        required: true
    },
    question: {
        type: String,
        required: true
    },
    answers: [{
        text: {
            type: String,
            required: true
        },
        isRightAnswer: {
            type: Boolean,
            required: true
        }
    }],
    deleted: {
        type: Boolean,
        default: false
    }
},{ timestamps: true });

module.exports = FlashCardSchema;
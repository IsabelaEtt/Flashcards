let mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

let UserFlashCardSchema = new mongoose.Schema({ 
    user: {
        type: ObjectId,
        ref: "User",
        required: true
    },
    flashCard: {
        type: ObjectId,
        ref: "FlashCard",
        required: true
    },
    timesAnsweredRigh: {
        type: Number,
    },
    deleted: {
        type: Boolean,
        default: false
    }
},{ timestamps: true });

UserFlashCardSchema.pre("validate", async function(cb) {
    if (this.user != undefined && this.flashCard != undefined) {
        const UserFlashCard = global.mongooseConnection.model("UserFlashCard");
        
        let query = {
            user: this.user,
            flashCard: this.flashCard,
            deleted: false,
            _id: { $ne: this._id }
        }

        let flashCardUserRelation;
        try { flashCardUserRelation = await UserFlashCard.findOne(query).select("_id");
        } catch(e) { console.log("error finding user in validator", e); }

        if (flashCardUserRelation) {
            cb(new Error(`O usuário ${this.user} já possui o flashcard ${this.flashCard}!`)); 
        }
    }
});

module.exports = UserFlashCardSchema;
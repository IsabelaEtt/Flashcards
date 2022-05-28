let mongoose = require("mongoose");
let ObjectId = mongoose.Schema.ObjectId;

let FriendshipSchema = new mongoose.Schema({ 
    user: {
        type: ObjectId,
        ref: "User",
        required: true
    },
    friend: {
        type: ObjectId,
        ref: "User",
        required: true
    },
    deleted: {
        type: Boolean,
        default: false
    }
},{ timestamps: true });

FriendshipSchema.pre("validate", async function(cb) {
    if (this.user != undefined && this.friend != undefined) {
        const Friendship = global.mongooseConnection.model("Friendship");

        const friendshipQuery = {
            deleted: false,
            $or: [
                {
                    user: this.user,
                    friend: this.friend
                },
                {
                    user: this.friend,
                    friend: this.user
                }
            ],
            _id: { $ne: this._id }
        }
        
        let friendship;
        try { friendship = await Friendship.findOne(friendshipQuery).select("_id").lean();
        } catch(e) { console.log("error finding friendship in validator", e); }

        if (friendship) {
            cb(new Error(`Os usuários ${this.user} e ${this.friend} já são amigos!`)); 
        }
    }
});

module.exports = FriendshipSchema;
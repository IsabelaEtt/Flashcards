let mongoose = require("mongoose");

let UserSchema = new mongoose.Schema({ 
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    deleted: {
        type: Boolean,
        default: false
    }
},{ timestamps: true });

UserSchema.pre("validate", async function(cb) {
    if (this.username != undefined) {
        const User = global.mongooseConnection.model("User");
        
        let user;
        try { user = await User.findOne({ username: this.username, deleted: false }).select("_id");
        } catch(e) { console.log("error finding user in validator", e); }

        if (user && String(user._id) != String(this._id)) {
            cb(new Error(`O username ${this.username} já está sendo usado por um usuário em nossos sistemas!`)); 
        }
    }
});

module.exports = UserSchema;
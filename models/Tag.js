let mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

let TagSchema = new mongoose.Schema({ 
    owner: {
        type: ObjectId,
        ref: "User",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    deleted: {
        type: Boolean,
        default: false
    }
},{ timestamps: true });

TagSchema.pre("validate", async function(cb) {
    if (this.owner != undefined && this.name != undefined) {
        const Tag = global.mongooseConnection.model("Tag");
        
        let query = {
            owner: this.owner,
            name: this.name,
            deleted: false,
            _id: { $ne: this._id }
        }

        let tag;
        try { tag = await Tag.findOne(query).select("_id");
        } catch(e) { console.log("error finding tag in validator", e); }

        if (tag) {
            cb(new Error(`A tag ${this.name} já existe para o usuário ${this.owner}!`)); 
        }
    }
});

module.exports = TagSchema;
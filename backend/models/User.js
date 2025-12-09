const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    subscription: { type: Object, required: true },
    categorias: [String]
});

module.exports = mongoose.model("User", UserSchema);

// Ce fichier contient le models Player avec ses attributs

const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const playerSchema = new Schema({
    loginID: {
        type: String,
    },
    name: {
        type: String,
        required: true,
        unique: true,
    },
    motoColor: {
        type: String,
    },
    status: {
        type: String,
    },
    score:{
        type: Number,
    }
});

module.exports = mongoose.model('Player', playerSchema);

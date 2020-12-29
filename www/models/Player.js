// Ce fichier contient le models Player avec ses attributs

const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const playerSchema = new Schema({
    loginID: {
        type: String,
        unique: true,
    },
    name: {
        type: String,
        required: true,
        unique: true,
    },
    motoColor: {
        type: String,
        required: true,
        unique: true,
    },
    score:{
        type: Number,
    }
});

module.exports = mongoose.model('Player', playerSchema);

// Ce fichier contient le model GameState avec ses attributs
//const Player = require("./Player");

const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const gameStateSchema = new Schema({
    players: [
        {
            type: Array,
            //type: mongoose.Schema.Types.ObjectId,
            //ref: "Player",
        },
    ],
    playerCount: {
        type: Number,
    },
});

module.exports = mongoose.model('GameState', gameStateSchema);

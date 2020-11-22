// C'est le Server qui permet la Création des Comptes Utilisateurs
// Ainsi que la connection des Utilisateurs 

const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");

const UserRoute = require('../routes/route');

mongoose.connect('mongodb://127.0.0.1:27017/tron', {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;

db.on('error', error => {
    console.log(error);
});

db.once('open', () => {
    console.log('Database Connection works !');
}); 

const app = express();

app.use(morgan('dev'))
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log('Le Server est marche sur le port', PORT);
})

app.use('/api', UserRoute);

// Dans ce Controller, il y'a l'ensemble des Methodes permettant de gérer
// la Création et la Connection des Joueurs
/*
const Player = require("../models/Player");
const jwt = require('jsonwebtoken');

const registerOrLogin = (req, res, next) => {

    //let name = req.body.name;


    let player = new Player({
        name: req.body.name,
    });

    player
        .save()
        .then((player) => {
            res.json({
                message: "Welcome to the Game !",
            });
        })
        .catch((error) => {
            res.json({
                message: "An error occured !",
            });
        });


};

/*
const login = (req, res, next) => {
    var name = req.body.name;
    var password = req.body.password;

    User.findOne({$or: [{name: name}, {password: password}]})
        .then(user => {
            if(user){
                bcrypt.compare(password, user.password, function (error, result){
                    if(error){
                        res.json({
                            error: error
                        });
                    }
                    if(result){
                        let token = jwt.sign({name: user.name}, 'verySecretValue', {expiresIn: '1h'});
                        res.json({
                            message: 'Welcome ! Tirana, Dakar and CYK',
                            token: token
                        });
                    }else{
                        res.json({
                            message: 'Password does not matched !'
                        });
                    }
                })
            }
            else{
                res.json({
                    message: 'User does not exist'
                });
            }
        });
};


 */

/*
module.exports = { registerOrLogin, };


 */

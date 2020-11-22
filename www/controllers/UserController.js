// Dans ce Controller, il y'a l'ensemble des Methodes permettant de gérer 
// la Création et la Connection des Utilisateurs

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const register = (req, res, next) => {
    bcrypt.hash(req.body.password, 10, function(error, hashedPass) {
        if(error) {
            res.json({
                error: error
            })
        }
        
        let user = new User({
          name: req.body.name,
          password: hashedPass,
        });

        user
          .save()
          .then((user) => {
            res.json({
              message: "User Added Successfully !",
            });
          })
          .catch((error) => {
            res.json({
              message: "An error occured !",
            });
          });

    });


};

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


module.exports = { register, login };
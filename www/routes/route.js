// C'est le fichier permettant le Routage de l'application

const express = require("express");

const router = express.Router();


const UserController = require('../controllers/UserController');

router.post('/register', UserController.register);
router.post("/login", UserController.login);



module.exports = router;
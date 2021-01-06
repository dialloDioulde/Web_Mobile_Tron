![Tron](https://github.com/dialloDioulde/Web_Mobile_Tron/blob/client/www/img/logo.png)  
  
### Auteurs: Mamadou DIALLO, Antoine JAYET-LARAFFE, Kristi MIHALI  
  
Projet universitaire dans le cadre de notre M2 WIC à l'Université de Grenoble  
  
Jeu TRON multijoueurs et multiplateformes développée dans un environnement Cordova, en Node.JS.  
Utilisation de JavaScript, HTML, CSS et MongoDB.  
  
## Installation  
### 1-Prérequis  
Avoir installé Node.JS, et Anaconda ou MiniConda.  

Si besoin  
Node.JS : https://nodejs.org/en/download/  
Anaconda: https://www.anaconda.com/  
MiniConda: https://docs.conda.io/en/latest/miniconda.html  
  
### 2-Préparation de l'environnement Cordova  
Télécharger la dernière version d'Android Studio : https://developer.android.com/studio#downloads  
Si vous êtes sous Windows, télécharger également la dernière version de Gradle : https://gradle.org/next-steps/?version=6.6.1&format=bin  
  
Télécharger le script d'installation en fonction de votre système d'exploitation:  
 - Windows: https://github.com/dialloDioulde/Web_Mobile_Tron/blob/client/Installation/InstallationCordova.bat  
 - Linux/Mac OS: https://github.com/dialloDioulde/Web_Mobile_Tron/blob/client/Installation/InstallationCordova.sh  
  
Mettez ces fichiers dans un même répertoire, et ouvrer votre terminal conda pour exécuter le script d'insatllation.  
 - Windows : ```.\InstallationCordova.bat```  
 - Linux/Mac OS: ```source ./InstallationCordova.sh```  
Ce script a pour rôle de créer l'environnement Cordova nécessaire à l'application, et de créer le script de lancement de l'environnement (LaunchCordova).  
Lancer ce dernier:  
 - Windows : ```.\LaunchCordova.bat```  
 - Linux/Mac OS: ```source ./LaunchCordova.sh```  
   
Maintenant il nous faut paramétrer AndroidStudio.  
Vous pouvez ouvrir Android Studio directement depuis votre terminal en faisant  
 - Windows : ```studio.bat```  
 - Linux/Mac OS: ```studio.sh```  

Une fois le menu d'accueil d'Android Studio lancé, aller sur Configure -> SDK Manager et vérifier que le chemin d'installation des SDK soit bien dans DevWebDir/Sdk.  
Puis toujours dans le SDK Manager dans l'onglet SDK Tools : cocher et accepter Google Play Licensing Library.  

Voilà votre environnement est prêt ! vous pouvez le tester en faisant les commandes suivantes :  
```bash  
cordova create Test  
cd Test  
cordova platform add android  
cordova build android  
```  
Si tous ces commandes se déroulent sans problèmes votre environnement et fonctionnel, vous pouvez alors télécharger notre projet.  
  
### 3-Téléchargement du projet  
Placer vous dans le répertoire de travail (le même où vous avez mis les scripts d'installation) puis récupérer le code  
 - via git: ```git clone https://github.com/dialloDioulde/Web_Mobile_Tron.git```  
 - via zip: https://github.com/dialloDioulde/Web_Mobile_Tron/archive/client.zip  
  
## Préparation  
Une fois le code téléchargé  
```bash  
cd Web_Mobile_Tron  
npm install  
cordova plugin add cordova-plugin-device
```  
  
## Lancement  
Dans un terminal lancez le serveur www/server.js  
Pour cela placez-vous dans le terminal à l'emplacement du fichier et faites : ```node server.js```  
Puis, dans votre terminal avec l'environnement cordova faites : ```cordova run browser``` ou ```cordova run android```  ou ```cordova run ios``` selon la platrforme sur laquelle vous désirez lancer le jeu.  
  
## Prise en main du jeu  
Une fois le jeu lancé vous devez vous connecter en entrant un pseudo et en choississant votre moto (bleu, orange, vert, ou rouge).  
Une partie ne se lance que s'il y a au minimum 2 joueurs. Si c'est le cas un compte à rebours de 5 secondes vous permet de vous préparer, ensuite pour jouer vous devez utiliser les flèches directionnelles du clavier sur ordinateur ou votre doigt en le faisant glisser sur l'écran dans la direction souhaitée sur mobile.  
Une partie prend fin quand il ne reste plus qu'un joueur en vie. Un joueur meurt en touchant un adversaire, le bord de la zone de jeu, ou ses propres murs. Le gagnant est donc la dernière moto en vie.  
  

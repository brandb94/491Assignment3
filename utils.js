/**
 * Created by Brandon on 3/3/2016.
 */


/**
 * Bundles all of the game's pertinent data into an object and sends it off to the server.
 * @param game to save the state of
 */
function saveState(game) {

    var saveData = {};
    console.log("is it defined here? " + game.leftArmy);


    saveData['leftArmy'] =  [];
    saveData.rightArmy = [];

    deepCopyArmy(game.leftArmy, saveData.leftArmy);
    deepCopyArmy(game.rightArmy, saveData.rightArmy);

    console.log("Army after copy: " + saveData.leftArmy);


    console.log("Armies packed into data object");


    saveData["currentGameState"] = {};

    saveData.currentGameState.PREGAME = game.gameState.PREGAME;
    saveData.currentGameState.PAUSED = game.gameState.PAUSED;
    saveData.currentGameState.GAMEOVER = game.gameState.GAMEOVER;

    console.log("game states booleans packed into data object");

    saveData.leftDead = globals.leftDead;
    saveData.rightDead = globals.rightDead;


    socket.emit("save", {studentname: "Brandon Bell", statename: "gameState", data: JSON.stringify(saveData)});
    console.log("save message emitted");

}


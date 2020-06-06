// discord imports
const Discord = require("discord.js");
const bot = new Discord.Client();

// regular imports
const fs = require("fs");

// save related
const jsonFolder = "./json";
const saveDataPath = jsonFolder + "/saveData.json";
const adventureDataPath = jsonFolder + "/adventureData.json";
const playerAdventuresPath = jsonFolder + "/playerAdventures.json";
const playerPartiesPath = jsonFolder + "/playerParties.json";

//config
const configFile = require(jsonFolder + "/config.json");

// config files
const token = configFile.token;
const prefix = configFile.prefix;

bot.on("ready", () => {
    console.log("Bot is online.");

    if (fs.existsSync(saveDataPath)) {
        console.log("SaveData exists.");
    } else {
        console.log("SaveData does not exist.");
    }
});

bot.on("message", (message) => {
    if (!message.content.startsWith(prefix)) return;

    let args = message.content.slice(prefix.length).split(" ");

    switch (args[0].toLowerCase()) {
        case "create":
            start(message);
            break;

        case "up":
            up(message);
            break;

        case "display":
            display(message);
            break;

        case "ping":
            message.channel.send("don't ping me you fuck");
            break;

        case "help":
            message.channel.send("there ain't shit here");
            break;

        case "ratemywaifu":
            switch (args[1].toLowerCase()) {
                case "endorsi":
                    message.channel.send("widePeepoHappy");
                    break;
                default:
                    message.channel.send("garbo");
            }

        case "prefix":
            message.channel.send("current prefix is: " + prefix);
            break;

        case "adventure":
            adventureSwitch(message, args);
    }
});

/*
Helper function to return the save data as JSON map.
No need for arguments, since it's always using the same path.
*/
function getSaveData(path) {
    let saveData = JSON.parse(fs.readFileSync(path, 'utf-8'));
    return saveData;
}

/*
Helper function to return an object (player) with all necessary starting stats.
*/
function createNewPlayer(authorId) {
    let currentSaveData = getSaveData(saveDataPath);
    currentSaveData[authorId] = {
        level: 0,
        xp: 0,
        currentClass: null,
        classes: [{

        }],
        money: 0,
        partyId: null,
        inventory: []
    }
    return currentSaveData;
}

function createNewAdventure(id, advDataId, duration) {
    console.log("attempting to add a new json adventure with id " + advDataId + " and duration " + duration );
    let currentSaveData = getSaveData(playerAdventuresPath);

    currentSaveData[id] = {
        adventureData: advDataId,
        completion: duration, //add time calcuation
    }
    return currentSaveData;
}

/*
Faster to do mentionUser(authorId) than to do the concatenated string.
*/
function mentionUser(authorId) {
    return "<@" + authorId + ">";
}

/*
Creates new save data for a user with their id as the key.
If id already exists in the file, return immediately.
*/
function start(message) {
    var authorId = message.author.id;

    // If the id already exists in the save file, don't bother with creating a new user.
    if (getSaveData(saveDataPath).hasOwnProperty(authorId)) {
        message.channel.send("Sorry " + mentionUser(authorId) + ", you've already been isekai'd. "
            + "Try prestiging to isekai yourself again!");
        return;
    }

    // Passed all checks, append a new user id key to the current file.
    fs.writeFileSync(
        saveDataPath,
        JSON.stringify(createNewPlayer(authorId), null, 2),
        function writeJSON(err) {
            if (err) throw err;
        }
    )
    message.channel.send("Created a new save for " + mentionUser(authorId) + "!");
}

/*
Debug method to just level up current player. Don't bother making it clean I think.
*/
function up(message) {
    console.log("up command");
    var authorId = message.author.id;
    let currentSaveData = getSaveData(saveDataPath);
    currentSaveData[authorId]["level"] = parseInt(currentSaveData[authorId]["level"]) + 1;
    fs.writeFileSync(
        saveDataPath,
        JSON.stringify(currentSaveData, null, 2),
        function writeJSON(err) {
            if (err) throw err;
        }
    );
    message.channel.send(mentionUser(authorId) + " leveled up to level " + currentSaveData[authorId]["level"] + "!");
}

/*
Debug method to display current level.
*/
function display(message) {
    console.log("displaying level");
    message.channel.send("Current level is: " + getSaveData(saveDataPath)[message.author.id]["level"]);
}

function adventureSwitch(message, args) {
    switch (args[1]) {

        case "start":
            adventureStart(message, args[2]);
            break;

        case "status":
            adventureStatus();
            break;

        case "complete":
            adventureComplete();
            break;
    }
}

function adventureStart(message, adventureArgument) {
    /** PSEUDO
    get party id from player info
    get player adventure id from party id
    use player adventure id to check adventures.json and see if it exists
    if exists
    don't start
    else if not exists
    start a new one
    check args[2] to see what adventure data id
    check stored adventures to see what time and rewards
    calculate finish time
    store adventure id, finish time and adventure data id
     */

    console.log("attemping to start an adventure");

    var authorId = message.author.id;

    var playerPartyId = getSaveData(saveDataPath)[authorId]["partyId"];

    if (playerPartyId != null) {
        console.log("partyid: " + playerPartyId);

        //get the adventure ID from party
        let partyAdventure = getSaveData(playerPartiesPath);
        var partyAdventureId = partyAdventure[playerPartyId]["adventureId"];

        if (partyAdventureId == null || partyAdventureId == "") {
            console.log("party adventure id is null, can start a new adventure");
            
            //get adventure data (can move into createNewAdventure())
            var adventureDuration = getSaveData(adventureDataPath)[adventureArgument]["duration"];
            var newAdventureId = getRandomInt(1, 1000);

            //write new adventure into playerAdventures
            writeJson(playerAdventuresPath, createNewAdventure(newAdventureId, adventureArgument, adventureDuration));

            message.channel.send("Started a new adventure for " + mentionUser(authorId) + " on adventure id: " + newAdventureId + "!");
            partyAdventure[playerPartyId]["adventureId"] = newAdventureId;

            //Overwrite adventure id in party id
            writeJson(playerPartiesPath, partyAdventure);

        } else {
            message.channel.send("Already on an adventure, id: " + partyAdventureId);
        }
    } else {
        message.channel.send("Not in a party");
    }
}

function adventureStatus() {
    //get party id from player info
    //get player adventure id from party id
    //use player adventure id to check adventures.json and see if it exists
    //if not exists
    //throw error
    //else if exists
    //see if global time is later than set completion time
    //if not
    //print how long until adventure is finished
    //else
    //adventure is ready for completion, use complete (or just do automatically)

}

function adventureComplete() {

}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

  function writeJson(path, jsonString) {
    fs.writeFileSync(
        path,
        JSON.stringify(jsonString, null, 2),
        function writeJSON(err) {
            if (err) throw err;
        }
    )
  }

bot.login(token);

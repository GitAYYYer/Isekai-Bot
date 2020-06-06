// discord imports
const Discord = require("discord.js");
const bot = new Discord.Client();
const configFile = require("./config.json");

// regular imports
const fs = require("fs");

// config files
const token = configFile.token;
const prefix = configFile.prefix;

// save related
const saveDataPath = "./saveData.json";

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
            adventureSwitch(args);
    }
});

/*
Helper function to return the save data as JSON map.
No need for arguments, since it's always using the same path.
*/
function getSaveData() {
    let saveData = JSON.parse(fs.readFileSync(saveDataPath, 'utf-8'));
    return saveData;
}

/*
Helper function to return an object (player) with all necessary starting stats.
*/
function createNewPlayer(authorId) {
    let currentSaveData = getSaveData();
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
    if (getSaveData().hasOwnProperty(authorId)) {
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
    let currentSaveData = getSaveData();
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
    message.channel.send("Current level is: " + getSaveData()[message.author.id]["level"]);
}

function adventureSwitch() {
    switch (args[1]) {

        case "start":
            adventureStart();
            break;

        case "status":
            adventureStatus();
            break;

        case "complete":
            adventureComplete();
            break;
    }
}

function adventureStart() {
    //get party id from player info
    //get player adventure id from party id
    //use player adventure id to check adventures.json and see if it exists
    //if exists
        //don't start
    //else if not exists
        //start a new one
        //check args[2] to see what adventure data id
        //check stored adventures to see what time and rewards
        //calculate finish time
        //store adventure id, finish time and adventure data id
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

bot.login(token);

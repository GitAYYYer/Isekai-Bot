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
                    message.channel.send("widepeepohappy");
                    break;
                default:
                    message.channel.send("garbo");
            }

        case "prefix":
            message.channel.send("current prefix is: " + prefix);
            break;
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
Creates new save data for a user with their id as the key.
If the saveData.json already exists, return immediately (change in the future to not bother with a file check maybe).
If id already exists in the file, return immediately.
*/
function start(message) {
    var authorId = message.author.id;
    // Create the first user in a new file.
    if (!fs.existsSync(saveDataPath)) {
        var baseFile = {};
        baseFile[authorId] = {level: 0, name: 'name'};
        fs.appendFileSync(
            saveDataPath,
            JSON.stringify(baseFile, null, 2),
            function (err) {
                if (err) throw err;
            }
        );
        message.channel.send("Save file created. First save is <@" + authorId + ">'s.")
        return;
    }

    // If the id already exists in the save file, don't bother with creating a new user.
    if (getSaveData().hasOwnProperty(authorId)) {
        message.channel.send("Sorry <@" +authorId + ">, you've already been isekai'd. " 
        + "Try prestiging to isekai yourself again!");
        return;
    }

    // Passed all checks, append a new user id key to the current file.
    let currentSaveData = getSaveData();
    currentSaveData[authorId] = {level: 0, name: 'New Name'};
    fs.writeFileSync(
        saveDataPath,
        JSON.stringify(currentSaveData, null, 2),
        function writeJSON(err) {
            if (err) throw err;
        }
    )
    message.channel.send("Created a new save for <@" + authorId + ">!");
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
    message.channel.send("<@" + authorId + "> leveled up to level " + currentSaveData[authorId]["level"] + "!");
}

/*
Debug method to display current level.
*/
function display(message) {
    console.log("displaying level");
    message.channel.send("Current level is: " + getSaveData()[message.author.id]["level"]);
}

bot.login(token);

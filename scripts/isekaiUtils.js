const fs = require("fs");

// save related
const jsonFolder = `${__dirname}/../json`;
const saveDataPath = jsonFolder + "/saveData.json";
const adventureDataPath = jsonFolder + "/adventureData.json";
const playerAdventuresPath = jsonFolder + "/playerAdventures.json";
const playerPartiesPath = jsonFolder + "/playerParties.json";
const cooldownsPath = jsonFolder + "/cooldowns.json";
const shopPath = jsonFolder + "/shop.json";
const dungeonPath = jsonFolder + "/dungeon.json";
const bossesPath = jsonFolder + "/bosses.json";
const classesPath = jsonFolder + "/classes.json";

// config
const configFile = require(jsonFolder + "\\config.json");
const token = configFile.token;
const prefix = configFile.prefix;

function checkSaveExists(message) {
    return getJsonData(saveDataPath).hasOwnProperty(message.author.id);
}

function getUserFromMention(mention) {
    if (!mention) return;

    if (mention.startsWith("<@") && mention.endsWith(">")) {
        mention = mention.slice(2, -1);

        if (mention.startsWith("!")) {
            mention = mention.slice(1);
        }

        return mention;
    }
}

function isNull(value) {
    return value == null || value == "" || value == 0;
}

function writeJson(path, jsonString) {
    fs.writeFileSync(
        path,
        JSON.stringify(jsonString, null, 2),
        function writeJSON(err) {
            if (err) throw err;
        }
    );
}

/*
Helper function to return the save data as JSON map.
No need for arguments, since it's always using the same path.
*/
function getJsonData(path) {
    return JSON.parse(fs.readFileSync(path, "utf-8"));
}

/*
Faster to do mentionUser(authorId) than to do the concatenated string.
*/
function mentionUser(authorId) {
    return "<@" + authorId + ">";
}

/*
Helper function to get random int between a min and max.
*/
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; // Maximum is exclusive, minimum is inclusive.
}

/*
Debug method to just level up current player. Don't bother making it clean I think.
*/
function up(message) {
    const authorId = message.author.id;
    let currentSaveData = getJsonData(saveDataPath);
    currentSaveData[authorId]['level'] =
        parseInt(currentSaveData[authorId]['level']) + 1;

    writeJson(saveDataPath, currentSaveData);

    message.channel.send(`${mentionUser(authorId)} leveled up to level ${currentSaveData[authorId]['level']}!`);
}

/*
Debug method to display current level.
*/
function display(message) {
    message.channel.send(
        "Current level is: " + getJsonData(saveDataPath)[message.author.id]["level"]
    );
}

module.exports = {checkSaveExists, getUserFromMention, display, getJsonData, getRandomInt, isNull, mentionUser, up, writeJson, 
    jsonFolder, saveDataPath, adventureDataPath, cooldownsPath, playerAdventuresPath, shopPath, playerPartiesPath, classesPath, dungeonPath, bossesPath, token, prefix};
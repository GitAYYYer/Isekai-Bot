const utils = require("./isekaiUtils.js");

const adventureSwitch = (message, args) => {
    switch (args[1]) {
        case "start":
            adventureStart(message, args[2]);
            break;

        case "complete":
            adventureComplete(message);
            break;
    }
};

function createNewAdventure(id, advDataId, duration) {
    let currentSaveData = utils.getJsonData(utils.playerAdventuresPath);

    currentSaveData[id] = {
        adventureData: advDataId,
        completion: duration, //add time calcuation
    };
    return currentSaveData;
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
    const authorId = message.author.id;

    //check if the adventure the player is embarking on exists
    if (utils.isNull(adventureArgument) || !utils.getJsonData(utils.adventureDataPath).hasOwnProperty(adventureArgument)) {
        message.channel.send(`Please enter a valid ID, ${utils.mentionUser(authorId)}`);
        return;
    }

    let partyId = utils.getJsonData(utils.saveDataPath)[authorId]['partyId'];
    let playerParty = utils.getJsonData(utils.playerPartiesPath);

    if (!utils.isNull(partyId)) {
        //get the adventure ID from party
        let partyAdventureId;

        try {
            partyAdventureId = playerParty[partyId]['adventureId'];
        } catch (err) {}

        if (utils.isNull(partyAdventureId)) {

            if (playerParty[partyId]["leader"] != authorId) {
                message.channel.send(`Only the party leader ${utils.mentionUser(playerParty[partyId]["leader"])} can begin the adventure.`);
                return;
            }
            //get adventure data (can move into createNewAdventure())
            let adventureDuration = utils.getJsonData(utils.adventureDataPath)[adventureArgument]['duration'];
            let newAdventureId = utils.getRandomInt(1, 1000);

            //write new adventure into playerAdventures
            utils.writeJson(utils.playerAdventuresPath,createNewAdventure(newAdventureId,adventureArgument,parseInt(adventureDuration) + Date.now()));

            let membersString = "";
            for (let i = 0; i < playerParty[partyId]["members"].length; i++) {
                membersString += utils.mentionUser(playerParty[partyId]["members"][i]) + ", ";
            }
            membersString = membersString.substring(0, membersString.length - 2);
            message.channel.send(`Started a new adventure for ${membersString} on adventure ID: ${newAdventureId}!`);

            //Overwrite adventure id in party id
            playerParty[partyId]['adventureId'] = newAdventureId;
            utils.writeJson(utils.playerPartiesPath, playerParty);
        } else {
            message.channel.send(`Already on an adventure, ID: ${partyAdventureId}.`);
        }
    } else {
        message.channel.send("Join a party first");
    }
}

function adventureComplete(message) {
    let partyId = utils.getJsonData(utils.saveDataPath)[message.author.id]["partyId"];
    let party = utils.getJsonData(utils.playerPartiesPath);

    //check if they're in a party
    if (!utils.isNull(partyId)) {
        let adventureId = party[partyId]["adventureId"];

        //check if they're on an adventure
        if (!utils.isNull(adventureId)) {
            let adventure = utils.getJsonData(utils.playerAdventuresPath);
            var completionTime = utils.getJsonData(utils.playerAdventuresPath)[adventureId]["completion"];

            //if date is past set completion date
            if (Date.now() < completionTime) {
                let remainingTime = humanizeDuration(completionTime - Date.now());
                message.channel.send(`You haven't completed your adventure yet. Complete in: ${remainingTime}.`);
            } else {
                message.channel.send("Completed.");

                //reset adventure id in party
                party[partyId]["adventureId"] = 0;
                utils.writeJson(utils.playerPartiesPath, party);

                //delete adventure
                delete adventure[adventureId];
                utils.writeJson(utils.playerAdventuresPath, adventure);
            }
        } else {
            message.channel.send(`You're not on an adventure, ${utils.mentionUser(message.author.id)}.`);
        }
    } else {
        message.channel.send(`You're not in a party, ${utils.mentionUser(message.author.id)}.`);
    }
}

module.exports = {adventureSwitch};

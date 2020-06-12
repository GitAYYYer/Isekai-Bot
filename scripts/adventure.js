const utils = require("./isekaiUtils.js");
const humanizeDuration = require('humanize-duration');

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
    const currentSaveData = utils.getJsonData(utils.saveDataPath);

    //check if the adventure the player is embarking on exists
    if (utils.isNull(adventureArgument) || !utils.getJsonData(utils.adventureDataPath).hasOwnProperty(adventureArgument)) {
        message.channel.send(`Please enter a valid ID, ${utils.mentionUser(authorId)}`);
        return;
    }

    let partyId = utils.getJsonData(utils.saveDataPath)[authorId]['partyId'];
    let allParties = utils.getJsonData(utils.playerPartiesPath);

    if (!utils.isNull(partyId)) {
        //get the adventure ID from party
        let partyAdventureId = allParties[partyId]['adventureId'];
        
        // if there is no partyAdventureId, then the party can go on a new adventure.
        if (utils.isNull(partyAdventureId)) {
            // check author is party leader
            if (allParties[partyId]["leader"] != authorId) {
                message.channel.send(`Only the party leader ${utils.mentionUser(allParties[partyId]["leader"])} can begin the adventure.`);
                return;
            }

            const adventureObject = utils.getJsonData(utils.adventureDataPath);

            // check the level of everyone in the party meets the adventure's minimum.
            const minimumAdventureLevel = parseInt(adventureObject[adventureArgument]['levelReq']);
            for (var playerId of allParties[partyId]['members']) {
                if (parseInt(currentSaveData[playerId]['level']) < minimumAdventureLevel) {
                    message.channel.send(`Player ${utils.mentionUser(playerId)} does not meet the minimum level requirement of ${minimumAdventureLevel}.`)
                    return;
                }
            }

            // get adventure data (can move into createNewAdventure())
            let adventureDuration = adventureObject[adventureArgument]['duration'];
            let newAdventureId = utils.getRandomInt(1, 1000);

            // write new adventure into playerAdventures
            utils.writeJson(utils.playerAdventuresPath,createNewAdventure(newAdventureId,adventureArgument,parseInt(adventureDuration) + Date.now()));

            let membersString = "";
            for (let i = 0; i < allParties[partyId]["members"].length; i++) {
                membersString += utils.mentionUser(allParties[partyId]["members"][i]) + ", ";
            }
            membersString = membersString.substring(0, membersString.length - 2);
            message.channel.send(`Started a new adventure for ${membersString} on adventure ID: ${newAdventureId}!`);

            //Overwrite adventure id in party id
            allParties[partyId]['adventureId'] = newAdventureId;
            utils.writeJson(utils.playerPartiesPath, allParties);
        } else {
            message.channel.send(`Already on an adventure, ID: ${partyAdventureId}.`);
        }
    } else {
        message.channel.send(`Please join a party first before you start adventuring, ${utils.mentionUser(authorId)}`);
    }
}

//TODO reward money, exp and loot after completion. Money and exp are easy to do for now.
function adventureComplete(message) {
    const authorId = message.author.id;
    const currentSaveData = utils.getJsonData(utils.saveDataPath);
    const party = utils.getJsonData(utils.playerPartiesPath);
    const adventureData = utils.getJsonData(utils.adventureDataPath);

    let partyId = utils.getJsonData(utils.saveDataPath)[message.author.id]["partyId"];

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
                // If didn't pass stat check, give console message saying didnt pass and return.
                // OPTIONAL: Do a collector here, and give them a choice to see their stats vs the min stats.
                if (!passedStatCheck(currentSaveData, party, partyId, parseInt(adventureData[adventure[adventureId]['adventureData']]['totalStatsReq']))) {
                    message.channel.send(`${utils.mentionUser(authorId)}, your party failed the adventure! :( Try leveling your raw stats up a bit.`);
                } else {
                    message.channel.send("Completed.");
                }

                //reset adventure id in party
                party[partyId]["adventureId"] = 0;
                utils.writeJson(utils.playerPartiesPath, party);

                //delete adventure
                delete adventure[adventureId];
                utils.writeJson(utils.playerAdventuresPath, adventure);
            }
        } else {
            message.channel.send(`You're not on an adventure, ${utils.mentionUser(authorId)}.`);
        }
    } else {
        message.channel.send(`You're not in a party, ${utils.mentionUser(authorId)}.`);
    }
}

/*
Helper function to compare the team's total stats vs adventure's total stats req.
Return boolean based on if the stat check passes or not.
*/
function passedStatCheck(currentSaveData, party, partyId, adventureMinStatsReq) {
    let totalStats = 0;

    // for each member, add all their raw stats to 'totalStats' variable.
    for (var playerId of party[partyId]['members']) {
        const playerRawStats = currentSaveData[playerId]['rawStats'];

        for (var stat in playerRawStats) {
            totalStats += parseFloat(playerRawStats[stat]);
        }
    }
    let randomChance = Math.random();

    // if randomChance is less than or equal to the (totalStats/adventureMinStatsReq), consider statCheck as passed.
    if (randomChance <= (totalStats/adventureMinStatsReq)) {
        return true;
    } else {
        return false;
    }
}

module.exports = {adventureSwitch};

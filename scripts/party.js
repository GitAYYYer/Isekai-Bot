const utils = require("./isekaiUtils.js");
const Discord = require("discord.js");

function createNewParty(id, playerId) {
    let currentSaveData = utils.getJsonData(utils.playerPartiesPath);

    currentSaveData[id] = {
        leader: playerId,
        adventureId: 0,
        members: [playerId],
    };
    return currentSaveData;
}

function partySwitch(message, args) {
    switch (args[1]) {
        case "create":
            partyCreate(message, args[2]);
            break;

        case "view":
            partyView(message);
            break;

        case "leave":
            partyLeave(message);
            break;

        case "join":
            partyJoin(message, utils.getUserFromMention(args[2]));
            break;

        case "invite":
            partyInvite(message, utils.getUserFromMention(args[2]));
            break;
    }
}

function partyCreate(message, args) {
    const authorId = message.author.id;
    let playerSave = utils.getJsonData(utils.saveDataPath);
    let playerSavePartyId = playerSave[authorId]['partyId'];

    if (utils.isNull(playerSavePartyId)) {
        //TODO: check the newPartyId does not already exist.
        let newPartyId = utils.getRandomInt(0, 10000);
        utils.writeJson(utils.playerPartiesPath, createNewParty(newPartyId, authorId));

        playerSave[message.author.id]['partyId'] = newPartyId;
        utils.writeJson(utils.saveDataPath, playerSave);

        message.channel.send(`New party has been created with ID: ${newPartyId}.`);
    } else {
        message.channel.send(`You're already in a party with ID: ${playerSavePartyId}`);
    }
}

function partyView(message) {
    const authorId = message.author.id;
    let playerParty = utils.getJsonData(utils.saveDataPath);
    let playerPartyId = playerParty[message.author.id]['partyId'];

    if (utils.isNull(playerPartyId)) {
        message.channel.send(`You're not currently in a party, ${utils.mentionUser(authorId)}.`);
        return;
    }

    let party = utils.getJsonData(utils.playerPartiesPath);
    let members = party[playerPartyId]['members'];

    var printStr = "Party leader is: " + utils.mentionUser(party[playerPartyId]['leader']) + ". The current members of your party are: ";
    for (var i = 0; i < members.length; i++) {
        printStr += utils.mentionUser(members[i]) + ", ";
    }
    message.channel.send(printStr.substring(0, printStr.length - 1));
}

function partyLeave(message) {
    let saveData = utils.getJsonData(utils.saveDataPath);
    let playerPartyId = saveData[message.author.id]['partyId'];

    if (utils.isNull(playerPartyId)) {
        message.channel.send(`You're not currently in a party, ${utils.mentionUser(message.author.id)}.`);
        return;
    }

    let party = utils.getJsonData(utils.playerPartiesPath);
    let members = party[playerPartyId]['members'];

    //remove from members list
    for (var i = 0; i < members.length; i++) {
        if (members[i] == message.author.id) {
            members.splice(i, 1);
        }
    }

    //check if they were a leader
    if (party[playerPartyId]['leader'] == message.author.id) {
        //if no other members, delete party
        if (members.length == 0) {
            delete party[playerPartyId];
            message.channel.send("Party is now empty, deleting.");
        } else {
            //else, designate the next person as leader
            party[playerPartyId]['leader'] = members[0];
            message.channel.send(`${utils.mentionUser(members[0])} is the new party leader.`);
        }
    } else {
        message.channel.send("You have left the party.");
    }

    //reset player party id in savedata
    saveData[message.author.id]["partyId"] = 0;

    utils.writeJson(utils.saveDataPath, saveData);
    utils.writeJson(utils.playerPartiesPath, party);
}

function partyJoin(message, targetPlayer) {
    //grab the party id of the target player
    //see if the party is full
    //make it the new message author party id
    //add the member to the party[members]
    const authorId = message.author.id;

    if (utils.isNull(targetPlayer)) {
        message.channel.send(`'${targetPlayer}' is not a valid player. Please enter an existing player.`);
        return;
    }

    let playerSave = utils.getJsonData(utils.saveDataPath);

    //if target player exists
    if (!playerSave.hasOwnProperty(targetPlayer)) {
        message.channel.send(`${utils.mentionUser(targetPlayer)} has no save data!`);
        return;
    }

    let playerSavePartyId = playerSave[authorId]['partyId'];

    if (!utils.isNull(playerSavePartyId)) {
        message.channel.send(`You're already in a party, ${utils.mentionUser(authorId)}. Please leave your current one first.`);
        return;
    }

    let targetSavePartyId = playerSave[targetPlayer]["partyId"];

    if (utils.isNull(targetSavePartyId)) {
        message.channel.send(`Target player ${utils.mentionUser(targetPlayer)} is not currently in a party.`);
        return;
    }

    let party = utils.getJsonData(utils.playerPartiesPath);
    let partyLeader = party[targetSavePartyId]['leader'];
    message.channel.send(`${utils.mentionUser(authorId)} wants to join your party, ${utils.mentionUser(partyLeader)}. You can accept or decline.`)

    // Check party leader response for accept or decline.
    const collector = new Discord.MessageCollector(message.channel, m => m.author.id === partyLeader, {
        time: 10000
    });
    collector.on('collect', replyMessage => {
        if (replyMessage.content.toLowerCase() == 'accept') {
            replyMessage.channel.send(`${utils.mentionUser(partyLeader)} has accepted ${utils.mentionUser(authorId)} into the party.`);

            party[playerSavePartyId]['members'].push(authorId);
            playerSave[authorId]['partyId'] = targetSavePartyId;

            utils.writeJson(utils.saveDataPath, playerSave);
            utils.writeJson(utils.playerPartiesPath, party);
            collector.stop('accepted');
        } else if (replyMessage.content.toLowerCase() == 'decline') {
            replyMessage.channel.send(`${utils.mentionUser(partyLeader)} has declined your request to join, ${utils.mentionUser(authorId)}.`);
            collector.stop('declined');
        }
    });
    // Can use either collected.has('accepted')/collected.has('declined'), or reason === 'accepted'/reason === 'declined'
    collector.on('end', (collected, reason) => {
        if (reason !== 'accepted' && reason !== 'declined')
            message.channel.send(`${utils.mentionUser(partyLeader)} did not respond to ${utils.mentionUser(authorId)}'s request to join.`);
    })
}

/*
Check target player exists, message author is party leader, and party is not full.
On successful checks, push the target player into the party.
*/
function partyInvite(message, targetPlayer) {
    // Check if targetPlayer is valid
    if (utils.isNull(targetPlayer)) {
        message.channel.send(`'${targetPlayer}' is not a valid player. Please enter an existing player.`);
        return;
    }

    const authorId = message.author.id;
    let currentSaveData = utils.getJsonData(utils.saveDataPath);
    let invitersPartyId = currentSaveData[authorId]['partyId'];

    // Check if inviter is actually in a party
    if (utils.isNull(invitersPartyId)) {
        message.channel.send(`${utils.mentionUser(authorId)} is not currently in a party. Join one first before using ${utils.prefix}invite`);
        return;
    }

    // Check if the inviter (author) is the leader of their party (compare leader id to the author id).
    if (utils.getJsonData(utils.playerPartiesPath)[invitersPartyId]['leader'] != authorId) {
        message.channel.send(`You cannot invite someone to your party ${utils.mentionUser(authorId)}, since you aren't the leader.`);
        return;
    }

    //if target player exists
    if (!currentSaveData.hasOwnProperty(targetPlayer)) {
        message.channel.send(`${utils.mentionUser(targetPlayer)} has no save data!`);
        return;
    }

    // Check if targetPlayer is already in a party
    let inviteePartyId = currentSaveData[targetPlayer]['partyId'];
    if (!utils.isNull(inviteePartyId)) {
        message.channel.send(`${utils.mentionUser(targetPlayer)} is already in a party.`);
        return;
    }

    message.channel.send(`${utils.mentionUser(authorId)} has invited ${utils.mentionUser(targetPlayer)} to their party. ${utils.mentionUser(targetPlayer)} can accept or decline.`);

    // Passed all checks, now wait for response from targetPlayer to accept invite.
    const collector = new Discord.MessageCollector(message.channel, m => m.author.id === targetPlayer, {
        time: 10000
    });
    collector.on('collect', replyMessage => {
        if (replyMessage.content.toLowerCase() == 'accept') {
            replyMessage.channel.send(`${utils.mentionUser(targetPlayer)} has accepted ${utils.mentionUser(authorId)}'s invite.`);

            let party = utils.getJsonData(utils.playerPartiesPath);
            party[invitersPartyId]['members'].push(targetPlayer);
            currentSaveData[targetPlayer]['partyId'] = invitersPartyId;

            utils.writeJson(utils.saveDataPath, currentSaveData);
            utils.writeJson(utils.playerPartiesPath, party);
            collector.stop('accepted');
        } else if (replyMessage.content.toLowerCase() == 'decline') {
            replyMessage.channel.send(`${utils.mentionUser(targetPlayer)} has declined ${utils.mentionUser(authorId)}'s invite.`);
            collector.stop('declined');
        }
    });
    // Can use either collected.has('accepted')/collected.has('declined'), or reason === 'accepted'/reason === 'declined'
    collector.on('end', (collected, reason) => {
        if (reason !== 'accepted' && reason !== 'declined')
            message.channel.send(`${utils.mentionUser(targetPlayer)} did not respond to ${utils.mentionUser(authorId)}'s invite.`);
    })
}

module.exports = {partySwitch};

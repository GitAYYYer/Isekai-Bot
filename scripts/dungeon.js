const utils = require("./isekaiUtils.js");
const Discord = require("discord.js");
const guild = new Discord.Guild();

const dungeonSwitch = (message, args) => {
    switch (args[1]) {
        //Returns a list of dungeons available to be taken by the user who sent the message
        case "list":
            dungeonList(message);
            break;
        case "start":
        dungeonStart(message);
        break;
        case "delete":
            dungeonDelete(message);
            break;

    }
};

//Hardcode entire dungeon in dungeon.js for now
const dungeonList = () => {
    let dungeons = utils.getJsonData(utils.dungeonPath);
    
    message.channel.send()
}

// let newChannel;
let newChannelID;
//Dungeon level requirement is limitied by the lowest lvl in party
const dungeonStart = (message) => {
    const authorId = message.author.id;
    let partyId = utils.getJsonData(utils.saveDataPath)[authorId]['partyId'];

    let allParties = utils.getJsonData(utils.playerPartiesPath);
    var newChannel;

    //TODO check the group of people participating in a dungeon, and then return which dungeons can be run

    //Check that the author is in a party
    //If player has a party ID
    if (!utils.isNull(partyId)) {
            //Only leader can start a dungeon
        if (allParties[partyId]["leader"] == authorId) {
            //Create a new text channel and wait for players to type ready in the new text channel

            let name = message.author.username;
            const guildChannelManager = message.guild.channels;
            const newChannel = guildChannelManager.create(`${name} dungeon`, { reason: 'Needed a cool new channel' })
            .then(console.log('then log'))
            .catch(console.error);

            newChannelID = newChannel.id;

            // const channel = guildChannelManager.resolve(newChannel);
            // channel.delete();


        } else {
            message.channel.send(`Only the party leader ${utils.mentionUser(allParties[partyId]["leader"])} can start a dungeon.`);
        }
    } else {
        message.channel.send("You have to be in a party to participate in a dungeon.")
    }

    // Get confirmation from all party members that they're ready.
    partyConfirmation(message, partyId, newChannel);
}

//Deletes a dungeon by id or name
const dungeonDelete = (message) => {
    const channels = message.guild.channels;
    console.log("In delete method 1");

    console.log("Channels", channels);
    // console.log("Channels", channels.guildChannelManager);

    // for (let obj in channels.cache) {
    //     console.log(obj.name);
    // }

    for (var id in channels.cache) {
        console.log("id in channel ", id);
        if (id == newChannelID) {
            channels[id].deleted = true;
            console.log("deleted");
        }
    }

}

/*
Helper function to check all party members are 'ready' before starting the actual dungeon run.
*/
function partyConfirmation(message, partyId, newChannel) {
    const authorId = message.author.id;
    // const saveData = utils.getJsonData(utils.saveDataPath);
    const allParties = utils.getJsonData(utils.playerPartiesPath);
    const partyMembers = allParties[partyId]['members']

    let membersReady = {};
    for (var memberId of partyMembers) {
        membersReady[memberId] = {ready: false};
    }
    console.log(newChannel);
    message.client.channels.cache.get(newChannelID).send(`Welcome to the dungeon! You have 10 seconds (debug) to type ..ready to confirm you're ready for the dungeon.`);

    // Accept messages as long as they're in the channel (only the party have access to this channel).
    const collector = new Discord.MessageCollector(newChannel, m => m.channel.id == newChannel.id, {
        time: 10000
    });
    // Players can ready up and unready. When all players have readied up, immediately end the collector.
    collector.on('collect', replyMessage => {
        if (replyMessage.content.toLowerCase() == '..ready') {
            newChannel.send(`${utils.mentionUser(replyMessage.author.id)} is ready.`);
            membersReady[replyMessage.author.id]['ready'] = true;
        } else if (replyMessage.content.toLowerCase() == '..unready') {
            newChannel.send(`${utils.mentionUser(replyMessage.author.id)} is not ready.`);
            membersReady[replyMessage.author.id]['ready'] = false;
        }
        
        // Checks for all keys in memberTurns, if they are all true (if all true, if statement is true)
        if (Object.keys(memberTurns).every(function(key) { return memberTurns[key]['ready']})) {
            newChannel.send(`All party members have readied up! Starting the dungeon in 10 seconds...`);
            collector.stop('All Ready');
        }
    });
    // Collector can stop when everyone is ready, or by timeout. If reason is not 'All Ready' then close the dungeon.
    collector.on('end', (collected, reason) => {
        if (!reason == 'All Ready') {
            message.channel.send(`The party did not ready up in time. Closing the dungeon...`);
            ducDelete(message, newChannel);
        }
    });
}

function ducDelete(message, newChannel) {
    console.log(`Deleting channel with id: ${newChannel.id} and name: ${newChannel.name}`);
    message.guild.channels[newChannel.id].deleted = true;
}

module.exports = {dungeonSwitch};
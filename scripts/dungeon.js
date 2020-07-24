const utils = require("./isekaiUtils.js");
const Discord = require("discord.js");
let dungeons = utils.getJsonData(utils.dungeonPath);
let allParties = utils.getJsonData(utils.playerPartiesPath);

const dungeonSwitch = (message, args) => {
    switch (args[1]) {
        //Returns a list of dungeons available to be taken by the user who sent the message
        case "list":
            dungeonList(message);
            break;
        case "start":
            dungeonStartCheck(message, args[2]);
            break;
        case "delete":
            dungeonDelete(message);
            break;
    }
};

//Hardcode entire dungeon in dungeon.js for now
const dungeonList = (message) => {
    // let dungeons = utils.getJsonData(utils.dungeonPath);
    let dungeonList = "";
    for (var id in dungeons) {
        dungeonList += `\n${dungeons[id].name}`;
    }
    message.channel.send(dungeonList);
}

let newChannelID;
//Dungeon level requirement is limitied by the lowest lvl in party


//Checks if valid dungeon was selected
//Will also check if party qualifies for the dungeon in this method
const dungeonStartCheck = (message, dungeonId) => {
    for (var id in dungeons) {
        if (id == dungeonId) {
            dungeonStart(message, dungeonId)
            break;
        }
    }

}

const dungeonStart = async (message, dungeonId) => {
    const authorId = message.author.id;

    let partyId = utils.getJsonData(utils.saveDataPath)[authorId]['partyId'];
    //TODO check the group of people participating in a dungeon, and then return which dungeons can be run

    //Check that the author is in a party
    //If player has a party ID
    if (!utils.isNull(partyId)) {
        //Only leader can start a dungeon
        if (allParties[partyId]["leader"] == authorId) {
            //Create a new text channel and wait for players to type ready in the new text channel

            let name = message.author.username;

            const newChannel = await asyncExample(message, name);

            //Store the channelId of the dungeon in activeDungeon.json
            newChannelID = newChannel.id;
            partyConfirmation(message, partyId, newChannel, dungeonId);
        } else {
            message.channel.send(`Only the party leader ${utils.mentionUser(allParties[partyId]["leader"])} can start a dungeon.`);
        }
    } else {
        message.channel.send("You have to be in a party to participate in a dungeon.")
    }
}

//Deletes a dungeon by id or name
const dungeonDelete = async (message) => {
    const channels = message.client.channels;

    const newChannel = await fetchChannel(channels, newChannelID);
    newChannel.delete();
}

/*
Helper function to check all party members are 'ready' before starting the actual dungeon run.
*/
function partyConfirmation(message, partyId, newChannel, dungeonId) {
    const allParties = utils.getJsonData(utils.playerPartiesPath);
    const partyMembers = allParties[partyId]['members'];
    let membersReady = {};
    for (var memberId of partyMembers) {
        membersReady[memberId] = { ready: false };
    }
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
        if (Object.keys(membersReady).every(function (key) { return membersReady[key]['ready'] })) {
            newChannel.send(`All party members have readied up! Starting the dungeon in 10 seconds...`);
            collector.stop('All Ready');
            //Or if leader specifically calls start
        } else if (allParties[partyId]["leader"] == replyMessage.author.id) {
            if (replyMessage.content.toLowerCase() == "start") {
                newChannel.send(`${utils.mentionUser(replyMessage.author.id)} has called Start`);
                collector.stop('Leader Start');
            }
        }
    });


    // Collector can stop when everyone is ready, or by timeout. If reason is not 'All Ready' then close the dungeon.
    collector.on('end', (collected, reason) => {
        if (reason == 'All Ready') {
            message.channel.send(`All party members have entered ready, the dungeon will now start`);
        } else if (reason == 'Leader Start') {
            // message.channel.send(`The leader has started the dungeon.`);
            dungeonRun(message, dungeonId);
        } else {
            newChannel.delete();
        }
    });
}

const asyncExample = async (message, name) => {
    const guildChannelManager = message.guild.channels;
    const newChannel = await guildChannelManager.create(`${name} dungeon`, { reason: 'Needed a cool new channel' });
    return newChannel
}

const fetchChannel = async (channels, newChannelID) => {
    const newChannel = await channels.fetch(newChannelID);
    return newChannel;
}

//Sets up a dungeon based on the dungeonData (this will mostly be hardcoded
// for now)
const dungeonRun = async (message, dungeonId) => {

    //Main dungeon playback (based on timeline)
    // message.channel.send(dungeonId);
    const channels = message.client.channels;
    const newChannel = await fetchChannel(channels, newChannelID);

    const dungeonTimeline = dungeons[dungeonId].timeline;

    for (const event of dungeonTimeline) {
        if (event.eventType == "boss") {
            await new Promise(r => setTimeout(r, 2000));
            sendTemporaryMessage("A Boss has appeared!", newChannel, 3000);
            await new Promise(r => setTimeout(r, 1000));
            bossBattle(newChannel, event.boss);
        }
    }
}

const bossBattle = async (channel, bossId) => {
    let bosses = utils.getJsonData(utils.bossesPath);
    let healthBar;
    let turnToggle;
    for (const boss in bosses) {
        if (boss == bossId) {
            const bossObj = bosses[boss];
            sendTemporaryMessage(`Prepare to fight ${bosses[boss].name}`, channel, 2000);
            channel.send(`Boss Name: ${bossObj.name}`);
            healthBar = await channel.send(getHPTextImage(
                bossObj.stats.combat.currentHP, bossObj.stats.combat.maxHP));
            channel.send({ files: ["./images/Slime.png"] });
        }
    }
}

const sendTemporaryMessage = async (messageString, channel, lifetime) => {
    let msg = await channel.send(messageString);
    setTimeout(() => {
        msg.delete();
    }, lifetime);
}

const getHPTextImage = (currentHealth, totalHealth) => {
    //There is a maximum of 50 bars
    // Find the ceil'd ratio of currentHealth / totalHealth
    // Multiply by 50 and generate that many bars
    // HP [==================================================] 50/50

    const healthRatio = Math.ceil(currentHealth / totalHealth);
    const healthBars = healthRatio * 50;

    let healthBarString = "HP [";
    for (let i = 0; i < healthBars; ++i) {
        healthBarString += "=";
    }
    healthBarString += `] ${Math.ceil(currentHealth)}/${totalHealth}`
    return healthBarString;
}


module.exports = { dungeonSwitch };
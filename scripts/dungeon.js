const utils = require("./isekaiUtils.js");
const Discord = require("discord.js");
const guild = new Discord.Guild();
const axios = require('axios').default;

const dungeonSwitch = (message, args) => {
    switch (args[1]) {
        //Returns a list of dungeons available to be taken by the user who sent the message
        case "list":
            dungeonList(message);
            break;
        case "start":
        // dungeonStart(message);
        reactDungeonStart(message);
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

let newChannelID;
//Dungeon level requirement is limitied by the lowest lvl in party
const dungeonStart = async (message) => {
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
        
            const newChannel = await asyncExample(message, name);

            // console.log("newChannel", newChannel);
            newChannelID = newChannel.id;
            console.log("newChannelID", newChannel.id);

            partyConfirmation(message, partyId, newChannel);
        } else {
            message.channel.send(`Only the party leader ${utils.mentionUser(allParties[partyId]["leader"])} can start a dungeon.`);
        }
    } else {
        message.channel.send("You have to be in a party to participate in a dungeon.")
    }
}

/*
Need to check the user is the leader of their party (only party leader can start)
Need to do a GET request with user's partyId to check if the party is already in dungeon.
*/
async function reactDungeonStart(message) {
    // TODO Send message to specific user, will need this later
    // message.client.users.fetch("175880304525836288").then((user) => {
    //     user.send("Hi");
    // })
    /*
    const authorId = message.author.id;
    const dungeonURL = 'http://ec2-13-238-89-92.ap-southeast-2.compute.amazonaws.com:3000';
    const dungeonEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Dungeon #123')
        .setURL('http://ec2-13-238-89-92.ap-southeast-2.compute.amazonaws.com:3000')
        .setDescription('This is a description')
        .addFields(
            {name: 'Member #1', value: 'Duck Haha'},
            {name: 'Member #2', value: 'Mot Baloney'},
            {name: 'Member #3', value: 'Wesley C Lee'}
        );
    
    message.author.send(`Hey there ${utils.mentionUser(authorId)}! To interact with the dungeon, head over to ${dungeonURL} to take part in the dungeon.`);
    message.author.send(dungeonEmbed);
    message.client.users.fetch("187817424337240064").then((user) => {
        user.send(dungeonEmbed);
    })
    */

    const authorId = message.author.id;
    const saveData = utils.getJsonData(utils.saveDataPath);
    const playerPartyId = saveData[authorId]['partyId'];
    const allParties = utils.getJsonData(utils.playerPartiesPath);

    const getURL = `http://localhost:3001/check-party-dungeon?partyId=${playerPartyId}`; 
    const postURL = `http://localhost:3001/create-dungeon`;
    // const getURL = `http://ec2-13-238-89-92.ap-southeast-2.compute.amazonaws.com:3001/check-party-dungeon?partyId=${playerPartyId}`;
    // const postURL = `http://ec2-13-238-89-92.ap-southeast-2.compute.amazonaws.com:3001/create-dungeon`;

    // Check message author is leader of their party
    if (authorId !== allParties[playerPartyId]['leader']) {
        message.channel.send(`${utils.mentionUser(authorId)}, only the leader of the party can start a dungeon run.`);
        return;
    }

    // Make a GET request to check the party does not have an active dungeon running.
    await axios.get(getURL)
    .catch(function (error) {
        message.author.send(`Hey there ${utils.mentionUser(authorId)}! Your party seems to already have an active dungeon running.`);
        return;
    });

    // Make POST request to the website, and wait for response
    await axios.post(postURL, {
        partyId: String(playerPartyId),
        partyMembers: allParties[playerPartyId]['members']
    })
    .catch(function (error) {
        // Keep this console log. There should be no error in the post, so if there is, we need to see what the error would be.
        console.log(error);
    });

    // Link user to their webpage
    message.author.send(`Hey there ${utils.mentionUser(authorId)}! Your party is ready to go dungeon running. Head over to our webpage below to interact with the dungeon. (SEND EMBEDDED LINK AS WELL)`);
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
function partyConfirmation(message, partyId, newChannel) {
    const allParties = utils.getJsonData(utils.playerPartiesPath);
    const partyMembers = allParties[partyId]['members'];
    let membersReady = {};
    for (var memberId of partyMembers) {
        membersReady[memberId] = {ready: false};
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
        if (Object.keys(membersReady).every(function(key) { return membersReady[key]['ready']})) {
            newChannel.send(`All party members have readied up! Starting the dungeon in 10 seconds...`);
            collector.stop('All Ready');
        }
    });
    // Collector can stop when everyone is ready, or by timeout. If reason is not 'All Ready' then close the dungeon.
    collector.on('end', (collected, reason) => {
        if (!reason == 'All Ready') {
            message.channel.send(`The party did not ready up in time. Closing the dungeon...`);
        }
        newChannel.delete();
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


module.exports = {dungeonSwitch};
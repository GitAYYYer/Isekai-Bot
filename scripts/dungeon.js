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
            .then(console.log("then log"))
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

module.exports = {dungeonSwitch};
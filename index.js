// discord imports
const Discord = require("discord.js");
const bot = new Discord.Client();

// regular imports
const fs = require("fs");
const humanizeDuration = require("humanize-duration");

// save related
const jsonFolder = "./json";
const saveDataPath = jsonFolder + "/saveData.json";
const adventureDataPath = jsonFolder + "/adventureData.json";
const playerAdventuresPath = jsonFolder + "/playerAdventures.json";
const playerPartiesPath = jsonFolder + "/playerParties.json";
const cooldownsPath = jsonFolder + "/cooldowns.json";
const shopPath = jsonFolder + "/shop.json";

// config
const configFile = require(jsonFolder + "/config.json");

// config files
const token = configFile.token;
const prefix = configFile.prefix;

// constant variables
const xpToNextLevelMultiplier = 1.5;

bot.on("ready", () => {
    console.log("Bot is online.");
});

bot.on("message", (message) => {
    if (!message.content.startsWith(prefix)) return;

    let args = message.content.slice(prefix.length).split(" ");
    if (!checkSaveExists(message) && args[0].toLowerCase() != "create") {
        message.channel.send(`Sorry you don't have save data ${mentionUser(message.author.id)}. Try doing ${prefix}create to make a new character.`);
        return;
    }
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

        case "train":
            train(message);
            break;

        case "work":
            work(message);
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
                adventureSwitch(message, args);
                break;

            case "party":
                partySwitch(message, args);
                break;

            case "shop":
                shopSwitch(message, args);
                break;

            case "buy":
                shopBuy(message, args[1]);
                break;

            case "balance":
                balance(message);
                break;

            case "inventory":
            case "i":
                inventory(message);
                break;
    }
});

function checkSaveExists(message) {
    if (!getJsonData(saveDataPath).hasOwnProperty(message.author.id)) {
        return false;
    }
    return true;
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
Helper function to return the save data as JSON map.
No need for arguments, since it's always using the same path.
*/
function getJsonData(path) {
    return JSON.parse(fs.readFileSync(path, "utf-8"));
}

/*
Helper function to return an object (player) with all necessary starting stats.
*/
function createNewPlayer(authorId) {
    let currentSaveData = getJsonData(saveDataPath);
    currentSaveData[authorId] = {
        level: 0,
        currentXP: 0,
        xpToNextLevel: 100,
        stats: {
            atk: 10,
            def: 10,
            hp: 10,
        },
        currentClass: null,
        classes: [{}],
        money: 0,
        partyId: null,
        inventory: [],
    };
    return currentSaveData;
}

/*
Helper function to populate all necessary cooldowns for new players.
*/
function createCooldowns(authorId) {
    let currentCooldowns = getJsonData(cooldownsPath);
    currentCooldowns[authorId] = {
        train: Date.now(),
        work: Date.now(),
        adventure: Date.now(),
    };
    return currentCooldowns;
}

function createNewAdventure(id, advDataId, duration) {
    let currentSaveData = getJsonData(playerAdventuresPath);

    currentSaveData[id] = {
        adventureData: advDataId,
        completion: duration, //add time calcuation
    };
    return currentSaveData;
}

function createNewParty(id, playerId) {
    let currentSaveData = getJsonData(playerPartiesPath);

    currentSaveData[id] = {
        leader: playerId,
        adventureId: 0,
        members: [playerId],
    };
    return currentSaveData;
}

/*
Creates new save data for a user with their id as the key.
If id already exists in the file, return immediately.
*/
function start(message) {
    const authorId = message.author.id;

    // If the id already exists in the save file, don't bother with creating a new user.
    if (getJsonData(saveDataPath).hasOwnProperty(authorId)) {
        message.channel.send(`Sorry ${mentionUser(authorId)}, you've already been isekai'd. Try prestiging to isekai yourself again!`);
        return;
    }

    // Passed all checks, append a new user id key to the current file.
    writeJson(saveDataPath, createNewPlayer(authorId));
    // Also add all cooldowns
    writeJson(cooldownsPath, createCooldowns(authorId));

    message.channel.send(`Created a new save for ${mentionUser(authorId)}!`);
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

function checkLevelUpAndChangeXP(message, currentSaveData, xpGain) {
    const authorId = message.author.id;
    let currentXP = parseInt(currentSaveData[authorId]["currentXP"]);
    let xpToNextLevel = parseInt(currentSaveData[authorId]["xpToNextLevel"]);
    let currentLevel = parseInt(currentSaveData[authorId]["level"]);

    // This case means you need to level up the player.
    if (currentXP + xpGain >= xpToNextLevel) {
        let leftoverXP = currentXP + xpGain - xpToNextLevel;
        currentSaveData[authorId]["level"] = currentLevel + 1;
        currentSaveData[authorId]["currentXP"] = leftoverXP;
        currentSaveData[authorId]["xpToNextLevel"] = xpToNextLevel * xpToNextLevelMultiplier;

        // This case means just change the currentXP value.
    } else {
        currentSaveData[authorId]["currentXP"] = currentXP + xpGain;
    }
    // Save the changes
    writeJson(saveDataPath, currentSaveData);

    // There are scenarios where you can level up twice in one xpGain, hence need to check and recall this function.
    // (I call getJsonData() here because I think currentSaveData will be the OLD copy of the json, before xp and levels are applied)
    if (parseInt(getJsonData(saveDataPath)[authorId]["currentXP"]) >= parseInt(getJsonData(saveDataPath)[authorId]["xpToNextLevel"])) {
        checkLevelUpAndChangeXP(message, getJsonData(saveDataPath), 0);
    }
}

/*
Train command gives player free exp, between 5% - 10% of their xpToNextLevel.
*/
function train(message) {
    const authorId = message.author.id;
    let trainingCooldown = getJsonData(cooldownsPath)[authorId]["train"];

    if (Date.now() < trainingCooldown) {
        let remainingTime = humanizeDuration(trainingCooldown - Date.now());
        message.channel.send(`You've already trained your butt off today ${mentionUser(authorId)}! Train again in ${remainingTime}.`);
    } else {
        let currentSaveData = getJsonData(saveDataPath);
        let cooldowns = getJsonData(cooldownsPath);
        let previousLevel = currentSaveData[authorId]["level"];

        // The minimum xp gain is 5% of your xp needed to level up.
        let minXpGain = parseInt(currentSaveData[authorId]["xpToNextLevel"]) * 0.05;
        // The maximum xp gain is 10% of your xp needed to level up.
        let maxXpGain = parseInt(currentSaveData[authorId]["xpToNextLevel"]) * 0.1;

        let xpGain = getRandomInt(minXpGain, maxXpGain);
        message.channel.send(`You've done your training for the day ${mentionUser(authorId)}! You've gained ${xpGain}XP.`);
        checkLevelUpAndChangeXP(message, currentSaveData, xpGain);

        // If the levels are not equal then the player must've leveled up.
        if (previousLevel != getJsonData(saveDataPath)[authorId]["level"])
            message.channel.send(`${mentionUser(authorId)} has leveled up from level ${previousLevel} to level ${getJsonData(saveDataPath)[authorId]["level"]}!`);

        // They can train again in 24 hours.
        cooldowns[authorId]["train"] = Date.now() + 86400000;
        writeJson(cooldownsPath, cooldowns);
    }
}

/*
Work command will give money, calculated based on a formula with your level.
*/
function work(message) {
    const authorId = message.author.id;
    let workCooldown = getJsonData(cooldownsPath)[authorId]["work"];

    if (Date.now() < workCooldown) {
        let remainingTime = humanizeDuration(workCooldown - Date.now());
        message.channel.send(`No one is looking for work right now ${mentionUser(authorId)}. Come check back in ${remainingTime} for some work!`);
    } else {
        let currentSaveData = getJsonData(saveDataPath);
        let cooldowns = getJsonData(cooldownsPath);

        let minMoneyGain = 10;
        let maxMoneyGain = 50;
        let moneyGain = getRandomInt(minMoneyGain, maxMoneyGain);
        currentSaveData[authorId]['money'] = moneyGain;
        writeJson(saveDataPath, currentSaveData);

        // 30 minutes between working
        cooldowns[authorId]['work'] = Date.now() + 1800000;
        writeJson(cooldownsPath, cooldowns);

        message.channel.send(`You did some work for the townspeople ${mentionUser(authorId)}! You've earned $${moneyGain}.`);
    }
}

function adventureSwitch(message, args) {
    switch (args[1]) {
        case "start":
            adventureStart(message, args[2]);
            break;

        case "complete":
            adventureComplete(message);
            break;
    }
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
            partyJoin(message, getUserFromMention(args[2]));
            break;

        case "invite":
            partyInvite(message, getUserFromMention(args[2]));
            break;
    }
}

function partyCreate(message, args) {
    const authorId = message.author.id;
    let playerSave = getJsonData(saveDataPath);
    let playerSavePartyId = playerSave[authorId]['partyId'];

    if (isNull(playerSavePartyId)) {
        //TODO: check the newPartyId does not already exist.
        let newPartyId = getRandomInt(0, 10000);
        writeJson(playerPartiesPath, createNewParty(newPartyId, authorId));

        playerSave[message.author.id]['partyId'] = newPartyId;
        writeJson(saveDataPath, playerSave);

        message.channel.send(`New party has been created with ID: ${newPartyId}.`);
    } else {
        message.channel.send(`You're already in a party with ID: ${playerSavePartyId}`);
    }
}

function partyView(message) {
    const authorId = message.author.id;
    let playerParty = getJsonData(saveDataPath);
    let playerPartyId = playerParty[message.author.id]['partyId'];

    if (isNull(playerPartyId)) {
        message.channel.send(`You're not currently in a party, ${mentionUser(authorId)}.`);
        return;
    }

    let party = getJsonData(playerPartiesPath);
    let members = party[playerPartyId]['members'];

    var printStr = "Party leader is: " + mentionUser(party[playerPartyId]['leader']) + ". The current members of your party are: ";
    for (var i = 0; i < members.length; i++) {
        printStr += mentionUser(members[i]) + ", ";
    }
    message.channel.send(printStr.substring(0, printStr.length - 1));
}

function partyLeave(message) {
    let saveData = getJsonData(saveDataPath);
    let playerPartyId = saveData[message.author.id]['partyId'];

    if (isNull(playerPartyId)) {
        message.channel.send(`You're not currently in a party, ${mentionUser(message.author.id)}.`);
        return;
    }

    let party = getJsonData(playerPartiesPath);
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
            message.channel.send(`${mentionUser(members[0])} is the new party leader.`);
        }
    } else {
        message.channel.send("You have left the party.");
    }

    //reset player party id in savedata
    saveData[message.author.id]["partyId"] = 0;

    writeJson(saveDataPath, saveData);
    writeJson(playerPartiesPath, party);
}

function partyJoin(message, targetPlayer) {
    //grab the party id of the target player
    //see if the party is full
    //make it the new message author party id
    //add the member to the party[members]

    if (isNull(targetPlayer)) {
        message.channel.send("Please enter the target player.");
        return;
    }

    let playerSave = getJsonData(saveDataPath);

    let playerSavePartyId = playerSave[message.author.id]['partyId'];

    if (!isNull(playerSavePartyId)) {
        message.channel.send(`You're already in a party, ${mentionUser(message.author.id)}. Please leave your current one first.`);
        return;
    }

    let targetSavePartyId = playerSave[targetPlayer]["partyId"];

    if (isNull(targetSavePartyId)) {
        message.channel.send(`Target player ${mentionUser(targetPlayer)} is not currently in a party.`);
        return;
    }

    let party = getJsonData(playerPartiesPath);
    party[targetSavePartyId]['members'].push(message.author.id);

    playerSave[message.author.id]['partyId'] = targetSavePartyId;

    writeJson(saveDataPath, playerSave);
    writeJson(playerPartiesPath, party);

    message.channel.send("Joined party.");
}

/*
Check target player exists, message author is party leader, and party is not full.
On successful checks, push the target player into the party.
*/
function partyInvite(message, targetPlayer) {
    // Check if targetPlayer is valid
    if (isNull(targetPlayer)) {
        message.channel.send(`'${targetPlayer}' is not a valid player. Please enter an existing player.`);
        return;
    }

    const authorId = message.author.id;
    let currentSaveData = getJsonData(saveDataPath);
    let invitersPartyId = currentSaveData[authorId]['partyId'];

    // Check if inviter is actually in a party
    if (isNull(invitersPartyId)) {
        message.channel.send(`${mentionUser(authorId)} is not currently in a party. Join one first before using ${prefix}invite`);
        return;
    }

    // Check if targetPlayer is already in a party
    let inviteePartyId = currentSaveData[targetPlayer]['partyId'];
    if (!isNull(inviteePartyId)) {
        message.channel.send(`${mentionUser(targetPlayer)} is already in a party.`);
        return;
    }

    message.channel.send(`${mentionUser(authorId)} has invited ${mentionUser(targetPlayer)} to their party.`);

    // Passed all checks, now wait for response from targetPlayer to accept invite.
    const collector = new Discord.MessageCollector(message.channel, m => m.author.id === targetPlayer, {
        time: 10000
    });
    collector.on('collect', replyMessage => {
        if (replyMessage.content.toLowerCase() == 'accept') {
            replyMessage.channel.send(`${mentionUser(targetPlayer)} has accepted ${mentionUser(authorId)}'s invite.`);

            let party = getJsonData(playerPartiesPath);
            party[invitersPartyId]['members'].push(targetPlayer);
            currentSaveData[targetPlayer]['partyId'] = invitersPartyId;

            writeJson(saveDataPath, currentSaveData);
            writeJson(playerPartiesPath, party);
            collector.stop('accepted');
        } else if (replyMessage.content.toLowerCase() == 'decline') {
            replyMessage.channel.send(`${mentionUser(targetPlayer)} has declined ${mentionUser(authorId)}'s invite.`);
            collector.stop('declined');
        } else {
            replyMessage.channel.send(`Please type 'accept' or 'decline', ${mentionUser(targetPlayer)}.`);
        }
    });
    // Can use either collected.has('accepted')/collected.has('declined'), or reason === 'accepted'/reason === 'declined'
    collector.on('end', (collected, reason) => {
        if (reason !== 'accepted' && reason !== 'declined')
            message.channel.send(`${mentionUser(targetPlayer)} did not respond to ${mentionUser(authorId)}'s invite.`);
    })
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
    if (isNull(adventureArgument) || !getJsonData(adventureDataPath).hasOwnProperty(adventureArgument)) {
        message.channel.send(`Please enter a valid ID, ${mentionUser(authorId)}`)
        return;
    }

    let partyId = getJsonData(saveDataPath)[authorId]['partyId'];
    let playerParty = getJsonData(playerPartiesPath);

    if (!isNull(partyId)) {
        //get the adventure ID from party
        let partyAdventureId;

        try {
            partyAdventureId = playerParty[partyId]['adventureId'];
        } catch (err) {}

        if (isNull(partyAdventureId)) {
            //get adventure data (can move into createNewAdventure())
            let adventureDuration = getJsonData(adventureDataPath)[adventureArgument]['duration'];
            let newAdventureId = getRandomInt(1, 1000);

            //write new adventure into playerAdventures
            writeJson(playerAdventuresPath,createNewAdventure(newAdventureId,adventureArgument,parseInt(adventureDuration) + Date.now()));

            message.channel.send(`Started a new adventure for ${mentionUser(authorId)}, on adventure ID: ${newAdventureId}!`);

            //Overwrite adventure id in party id
            playerParty[partyId]['adventureId'] = newAdventureId;
            writeJson(playerPartiesPath, playerParty);
        } else {
            message.channel.send(`Already on an adventure, ID: ${partyAdventureId}.`);
        }
    } else {
        message.channel.send("Join a party first");
    }
}

function adventureComplete(message) {
    let partyId = getJsonData(saveDataPath)[message.author.id]["partyId"];
    let party = getJsonData(playerPartiesPath);

    //check if they're in a party
    if (!isNull(partyId)) {
        let adventureId = party[partyId]["adventureId"];

        //check if they're on an adventure
        if (!isNull(adventureId)) {
            let adventure = getJsonData(playerAdventuresPath);
            var completionTime = getJsonData(playerAdventuresPath)[adventureId]["completion"];

            //if date is past set completion date
            if (Date.now() < completionTime) {
                let remainingTime = humanizeDuration(completionTime - Date.now());
                message.channel.send(`You haven't completed your adventure yet. Complete in: ${remainingTime}.`);
            } else {
                message.channel.send("Completed.");

                //reset adventure id in party
                party[partyId]["adventureId"] = 0;
                writeJson(playerPartiesPath, party);

                //delete adventure
                delete adventure[adventureId];
                writeJson(playerAdventuresPath, adventure);
            }
        } else {
            message.channel.send(`You're not on an adventure, ${mentionUser(message.author.id)}.`);
        }
    } else {
        message.channel.send(`You're not in a party, ${mentionUser(message.author.id)}.`);
    }
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

function getUserFromMention(mention) {
    if (!mention) return;

    if (mention.startsWith("<@") && mention.endsWith(">")) {
        mention = mention.slice(2, -1);

        if (mention.startsWith("!")) {
            mention = mention.slice(1);
        }

        return bot.users.cache.get(mention).id;
    }
}

function isNull(value) {
    return value == null || value == "" || value == 0;
}

function balance(message) {
    let players = getJsonData(saveDataPath);
    let player;
    let playerName = mentionUser(message.author.id);

    for (var id in players) {
        if (id == message.author.id) {
            player = players[id];
        }
    }

    message.channel.send(`${playerName}'s Wallet: $${player.money}`);
}

function inventory(message) {
    let players = getJsonData(saveDataPath);
    let player;
    let playerName = mentionUser(message.author.id);
    let inventoryList = "";

    for (var id in players) {
        if (id == message.author.id) {
            player = players[id];
        }
    }
    message.channel.send(`${playerName}'s Inventory:`);

    //Log out the number of the items with the same name instead of just having copies (future ticket)
    for (let item of player.inventory) {
        inventoryList += `${item.name} x${item.quantity}\n`;
    }

    if (inventoryList == "") {
        message.channel.send(`Sorry you don't have anything.`);
    } else {
        message.channel.send(`${inventoryList}`);
    }
}

//ShopSwitch is called when arg[0] is "shop"
//Upon "shop" command, shop is opened and list of items are displayed
function shopSwitch(message, args) {
    switch (args[1]) {
        case "list":
            shopList(message);
            break;
        case "buy":
            shopBuy(message, args[2]);
            break;
    }
}

function shopList(message) {
    let shop = getJsonData(shopPath);
    var shopItems = "Shop Items:\n";
    for (let i = 0; i < shop.items.length; i++) {
        shopItems += `${shop.items[i].name}  $${shop.items[i].cost}\n`;
    }
    message.channel.send(shopItems);
}

//Shop buy purchases the item from the shop and adds it to your inventoy.
//Update player's money & inventory
function shopBuy(message, itemName) {
    let players = getJsonData(saveDataPath);
    let player;
    let playerName = mentionUser(message.author.id);
    let shop = getJsonData(shopPath);
    let item;

    //Get player by message.author.id (Perhaps make util methods later for this)
    for (var id in players) {
        if (id == message.author.id) {
            player = players[id];
        }
    }

    //Get item by name (Perhaps make util method later for this)
    for (let itemObj of shop.items) {
        if (itemObj.name.toLowerCase() == itemName.toLowerCase()) {
            item = itemObj;
        }
    }

    if (item == null) {
        message.channel.send(
            `Sorry we don't have any more ${itemName}'s in stock right now`
        );
        //Multiple points of exit OMG Tim-Trigger alert
        return;
    }

    //Check if player has enough money to buy given item
    if (player.money - item.cost >= 0) {
        player.money -= item.cost;

        message.channel.send(
            `${playerName} bought a ${item.name} for $${item.cost}!\n${playerName}'s Wallet: $${player.money}`
        );

        //Check if player already has item, if they do increase the count

        let playerItem;
        let hasItemAlready = false;
        for (let playerItemTemp of player.inventory) {
            //Player already has at least one copy of this item
            if (playerItemTemp.name == item.name) {
                hasItemAlready = true;
                playerItem = playerItemTemp;
            }
        }

        if (hasItemAlready) {
            playerItem.quantity += 1;
        } else {
            let newItem = {
                name: item.name,
                cost: item.cost,
                quantity: 1
            };
            player.inventory.push(newItem);
        }

        writeJson(saveDataPath, players);
    } else {
        message.channel.send(`${playerName}'s Wallet: $${player.money}`);
        message.channel.send(`Sorry you don't have enough money to buy a ${item.name}. :(`);
    }
}

bot.login(token);
// discord imports
const Discord = require("discord.js");
const bot = new Discord.Client();

// regular imports
const humanizeDuration = require("humanize-duration");
const ping = require("minecraft-server-util");
const Danbooru = require('danbooru');


//js files
const adventureController = require("./scripts/adventure.js");
const partyController = require("./scripts/party.js");
const shopController = require("./scripts/shop.js");
const classesController = require("./scripts/classes.js");
const utils = require("./scripts/isekaiUtils.js");

// constant variables
const xpToNextLevelMultiplier = 1.5;

bot.on("ready", () => {
    console.log("Bot is online.");
});

bot.on("message", (message) => {
    noPrefixListener(message);
    if (!message.content.startsWith(utils.prefix)) return;

    let args = message.content.slice(utils.prefix.length).split(" ");
    if (!utils.checkSaveExists(message) && args[0].toLowerCase() != "create") {
        message.channel.send(`Sorry you don't have save data ${utils.mentionUser(message.author.id)}. Try doing ${utils.prefix}create to make a new character.`);
        return;
    }
    switch (args[0].toLowerCase()) {
        case "create":
            start(message);
            break;

        case "up":
            utils.up(message);
            break;

        case "display":
            utils.display(message);
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
                    message.channel.send("<:ayaya:720228188055273473>");
                    break;
                default:
                    message.channel.send("garbo");
            }
            break;

        case "prefix":
            message.channel.send("current prefix is: " + utils.prefix);
            break;

        case "adventure":
            adventureController.adventureSwitch(message, args);
            break;

        case "party":
            partyController.partySwitch(message, args);
            break;

        case "shop":
            shopController.shopSwitch(message, args);
            break;

        case "buy":
            shopController.shopBuy(message, args[1]);
            break;

        case "class":
            classesController.classesSwitch(message, args);
            break;

        case "combat":
            ducDebugCombat(message);
            break;

        case "balance":
            balance(message);
            break;

        case "inventory":
        case "i":
            inventory(message);
            break;

        case "mc":
            mc(args[1], message);
            break;

        case "anime":
            danbooru(message);
            break;

        default:
            message.channel.send("Did not recognise command.");
            break;
    }
});

/*
Helper function to return an object (player) with all necessary starting stats.
*/
function createNewPlayer(authorId) {
    let currentSaveData = utils.getJsonData(utils.saveDataPath);
    currentSaveData[authorId] = {
        level: 0,
        currentXP: 0,
        xpToNextLevel: 100,
        combatStats: {
            pAtk: 10,
            mAtk: 10,
            pDef: 10,
            mDef: 10,
            currentHP: 100,
            maxHP: 100,
        },
        rawStats: {
            str: 10,
            agi: 10,
            int: 10,
            vit: 10
        },
        currentClass: unclassed,
        classes: [{}],
        money: 0,
        partyId: null,
        inventory: [],
    };
    return currentSaveData;
}

/*
Called when a player levels up. Look at the classes.json, get their class, 
and increase their raw stats by the multipliers.
*/
function increaseStats(currentSaveData, authorId) {
    const classes = utils.getJsonData(utils.classesPath);
    let playerClass = currentSaveData[authorId]['currentClass'];
    let str = currentSaveData[authorId]['rawStats']['str'];
    let agi = currentSaveData[authorId]['rawStats']['agi'];
    let int = currentSaveData[authorId]['rawStats']['int'];
    let vit = currentSaveData[authorId]['rawStats']['vit'];

    // Make the current stat equal to itself multiplied by the multiplier. 
    // outermost parseFloat is because the .toFixed(2) method keeps 2 decimal places, but returns as a string.
    currentSaveData[authorId]['rawStats']['str'] = parseFloat((parseFloat(str) * classes[playerClass]['rawStatsMultiplier']['str']).toFixed(2));
    currentSaveData[authorId]['rawStats']['agi'] = parseFloat((parseFloat(agi) * classes[playerClass]['rawStatsMultiplier']['agi']).toFixed(2));
    currentSaveData[authorId]['rawStats']['int'] = parseFloat((parseFloat(int) * classes[playerClass]['rawStatsMultiplier']['int']).toFixed(2));
    currentSaveData[authorId]['rawStats']['vit'] = parseFloat((parseFloat(vit) * classes[playerClass]['rawStatsMultiplier']['vit']).toFixed(2));
}

/*
Helper function to populate all necessary cooldowns for new players.
*/
function createCooldowns(authorId) {
    let currentCooldowns = utils.getJsonData(utils.cooldownsPath);
    currentCooldowns[authorId] = {
        train: Date.now(),
        work: Date.now(),
        adventure: Date.now(),
    };
    return currentCooldowns;
}

/*
Creates new save data for a user with their id as the key.
If id already exists in the file, return immediately.
*/
function start(message) {
    const authorId = message.author.id;

    // If the id already exists in the save file, don't bother with creating a new user.
    if (utils.getJsonData(utils.saveDataPath).hasOwnProperty(authorId)) {
        message.channel.send(`Sorry ${utils.mentionUser(authorId)}, you've already been isekai'd. Try prestiging to isekai yourself again!`);
        return;
    }

    // Passed all checks, append a new user id key to the current file.
    utils.writeJson(utils.saveDataPath, createNewPlayer(authorId));
    // Also add all cooldowns
    utils.writeJson(utils.cooldownsPath, createCooldowns(authorId));

    message.channel.send(`Created a new save for ${utils.mentionUser(authorId)}!`);
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
        increaseStats(currentSaveData, authorId);

        // This case means just change the currentXP value.
    } else {
        currentSaveData[authorId]["currentXP"] = currentXP + xpGain;
    }
    // Save the changes
    utils.writeJson(utils.saveDataPath, currentSaveData);

    // There are scenarios where you can level up twice in one xpGain, hence need to check and recall this function.
    // (I call utils.getJsonData() here because I think currentSaveData will be the OLD copy of the json, before xp and levels are applied)
    if (parseInt(utils.getJsonData(utils.saveDataPath)[authorId]["currentXP"]) >= parseInt(utils.getJsonData(utils.saveDataPath)[authorId]["xpToNextLevel"])) {
        checkLevelUpAndChangeXP(message, utils.getJsonData(utils.saveDataPath), 0);
    }
}

/*
Train command gives player free exp, between 5% - 10% of their xpToNextLevel.
*/
function train(message) {
    const authorId = message.author.id;
    let trainingCooldown = utils.getJsonData(utils.cooldownsPath)[authorId]["train"];

    if (Date.now() < trainingCooldown) {
        let remainingTime = humanizeDuration(trainingCooldown - Date.now());
        message.channel.send(`You've already trained your butt off today ${utils.mentionUser(authorId)}! Train again in ${remainingTime}.`);
    } else {
        let currentSaveData = utils.getJsonData(utils.saveDataPath);
        let cooldowns = utils.getJsonData(utils.cooldownsPath);
        let previousLevel = currentSaveData[authorId]["level"];

        // The minimum xp gain is 5% of your xp needed to level up.
        let minXpGain = parseInt(currentSaveData[authorId]["xpToNextLevel"]) * 0.05;
        // The maximum xp gain is 10% of your xp needed to level up.
        let maxXpGain = parseInt(currentSaveData[authorId]["xpToNextLevel"]) * 0.1;

        let xpGain = utils.getRandomInt(minXpGain, maxXpGain);
        message.channel.send(`You've done your training for the day ${utils.mentionUser(authorId)}! You've gained ${xpGain}XP.`);
        checkLevelUpAndChangeXP(message, currentSaveData, xpGain);

        // If the levels are not equal then the player must've leveled up.
        if (previousLevel != utils.getJsonData(utils.saveDataPath)[authorId]["level"])
            message.channel.send(`${utils.mentionUser(authorId)} has leveled up from level ${previousLevel} to level ${utils.getJsonData(utils.saveDataPath)[authorId]["level"]}!`);

        // They can train again in 24 hours.
        cooldowns[authorId]["train"] = Date.now() + 86400000;
        utils.writeJson(utils.cooldownsPath, cooldowns);
    }
}

/*
Work command will give money, calculated based on a formula with your level.
*/
function work(message) {
    const authorId = message.author.id;
    let workCooldown = utils.getJsonData(utils.cooldownsPath)[authorId]["work"];

    if (Date.now() < workCooldown) {
        let remainingTime = humanizeDuration(workCooldown - Date.now());
        message.channel.send(`No one is looking for work right now ${utils.mentionUser(authorId)}. Come check back in ${remainingTime} for some work!`);
    } else {
        let currentSaveData = utils.getJsonData(utils.saveDataPath);
        let cooldowns = utils.getJsonData(utils.cooldownsPath);

        let minMoneyGain = 10;
        let maxMoneyGain = 50;
        let moneyGain = utils.getRandomInt(minMoneyGain, maxMoneyGain);
        currentSaveData[authorId]['money'] = moneyGain;
        utils.writeJson(utils.saveDataPath, currentSaveData);

        // 30 minutes between working
        cooldowns[authorId]['work'] = Date.now() + 1800000;
        utils.writeJson(utils.cooldownsPath, cooldowns);

        message.channel.send(`You did some work for the townspeople ${utils.mentionUser(authorId)}! You've earned $${moneyGain}.`);
    }
}

function balance(message) {
    let players = utils.getJsonData(utils.saveDataPath);
    let player;
    let playerName = utils.mentionUser(message.author.id);

    for (var id in players) {
        if (id == message.author.id) {
            player = players[id];
        }
    }

    message.channel.send(`${playerName}'s Wallet: $${player.money}`);
}

function inventory(message) {
    let players = utils.getJsonData(utils.saveDataPath);
    let player;
    let playerName = utils.mentionUser(message.author.id);
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

async function ducDebugCombat(message) {
    const authorId = message.author.id;
    const currentSaveData = utils.getJsonData(utils.saveDataPath);
    const party = utils.getJsonData(utils.playerPartiesPath);
    const partyMembers = party[currentSaveData[authorId]['partyId']]['members'];

    let memberTurns = {};
    for (var memberId of partyMembers) {
        memberTurns[memberId] = {turnTaken: false, command: null};
    }
    console.log(memberTurns);

    // Accept messages from anyone in the channel, since the channel can only be used by the party anyway.
    const collector = new Discord.MessageCollector(message.channel, function(m) { return true; }, {
        time: 10000
    });
    message.channel.send('Starting turn based combat');

    collector.on('collect', replyMessage => {
        if (!replyMessage.content.toLowerCase().startsWith('.use')) {
            console.log(`message from ${replyMessage.author.username} (${replyMessage.author.id}) did not start with .use`);
            return;
        }
        message.channel.send(`${utils.mentionUser(replyMessage.author.id)} used ${replyMessage.content.split(' ')[1]}!`);
        memberTurns[replyMessage.author.id]['turnTaken'] = true;

        // Checks for all keys in memberTurns, if they are all true (if all true, if statement is true)
        if (Object.keys(memberTurns).every(function(key) { return memberTurns[key]['turnTaken']})) {
            console.log("all members have taken their turn");
            collector.stop('endTurn')
        }
    });
    // Can use either collected.has('accepted')/collected.has('declined'), or reason === 'accepted'/reason === 'declined'
    collector.on('end', (collected, reason) => {
        if (reason == 'endTurn') {
            message.channel.send(`The party finished their turn. Applying damage and effects...`);
        } else {
            message.channel.send(`Timer ran out for the party's turn. Applying damage and effects...`);
        }
        // this should log each msg's contents from when collector started.
        collected.each(function(msg) {
            console.log(msg.content);
        });
        ducDebugBossTurn(message);
    });
}

async function ducDebugBossTurn(message) {
    message.channel.send("Async: This message should appear AFTER the collector finishes in debugCombat()");
}

function noPrefixListener(message) {
    if (message.author.id == '472141928578940958') {
        message.channel.send('<:ayaya:720228188055273473>');
    }
    switch (message.content.toLowerCase()) {
        case "garbo":
        case "who":
        case "???":
            message.channel.send("WH <:OMEGALUL:719390337323237410>");
            break;
        case "no":
            message.channel.send("N <:OMEGALUL:719390337323237410>");
            break;
    }
}

function mc(server, message) {
    let port = 25565;
    switch (server.toLowerCase()) {
        case "omni":
            port = 25566;
    }

    ping("122.111.176.250", port, (error, response) => {
        if (error) {
            message.channel.send("Server ping timed out.");
            throw error;
        }

        const Embed = new Discord.MessageEmbed()
            .setTitle('Server Status')
            .addField('Server IP', response.host)
            .addField('Server Version', response.version)
            .addField('Online Players', response.onlinePlayers);

        message.channel.send(Embed);
    })
}

function danbooru(message) {
// Perform a search for popular image posts
    const booru = new Danbooru();
    booru.posts({tags: 'rating:safe order:rank'}).then(posts => {
        // Select a random post from posts array
        const index = Math.floor(Math.random() * posts.length);
        const post = posts[index];

        // Get post's url and create a filename for it
        const url = booru.url(post.file_url);
        //const name = `${post.md5}.${post.file_ext}`;
        message.channel.send({files: [url.href]});
    })
}

bot.login(utils.token);
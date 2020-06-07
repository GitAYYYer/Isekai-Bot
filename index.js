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

//config
const configFile = require(jsonFolder + "/config.json");

// config files
const token = configFile.token;
const prefix = configFile.prefix;

bot.on("ready", () => {
  console.log("Bot is online.");

  if (fs.existsSync(saveDataPath)) {
    console.log("SaveData exists.");
  } else {
    console.log("SaveData does not exist.");
  }
});

bot.on("message", (message) => {
  if (!message.content.startsWith(prefix)) return;

  let args = message.content.slice(prefix.length).split(" ");
  if (!checkSaveExists(message) && args[0].toLowerCase() != "create") {
    message.channel.send(
      "Sorry, you don't have a save file " +
        mentionUser(message.author.id) +
        ". Try doing " +
        prefix +
        "create to make a new character."
    );
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
  console.log(
    "attempting to add a new json adventure with id " +
      advDataId +
      " and duration " +
      duration
  );
  let currentSaveData = getJsonData(playerAdventuresPath);

  currentSaveData[id] = {
    adventureData: advDataId,
    completion: duration, //add time calcuation
  };
  return currentSaveData;
}

function createNewParty(id, playerId) {
  console.log(
    "attempting to create a new party with id " +
      id +
      " for player: " +
      mentionUser(playerId)
  );
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
  var authorId = message.author.id;

  // If the id already exists in the save file, don't bother with creating a new user.
  if (getJsonData(saveDataPath).hasOwnProperty(authorId)) {
    message.channel.send(
      "Sorry " +
        mentionUser(authorId) +
        ", you've already been isekai'd. " +
        "Try prestiging to isekai yourself again!"
    );
    return;
  }

  // Passed all checks, append a new user id key to the current file.
  writeJson(saveDataPath, createNewPlayer(authorId));
  // Also add all cooldowns
  writeJson(cooldownsPath, createCooldowns(authorId));

  message.channel.send("Created a new save for " + mentionUser(authorId) + "!");
}

/*
Debug method to just level up current player. Don't bother making it clean I think.
*/
function up(message) {
  console.log("up command");
  var authorId = message.author.id;
  let currentSaveData = getJsonData(saveDataPath);
  currentSaveData[authorId]["level"] =
    parseInt(currentSaveData[authorId]["level"]) + 1;

  writeJson(saveDataPath, currentSaveData);

  message.channel.send(
    mentionUser(authorId) +
      " leveled up to level " +
      currentSaveData[authorId]["level"] +
      "!"
  );
}

/*
Debug method to display current level.
*/
function display(message) {
  console.log("displaying level");
  message.channel.send(
    "Current level is: " + getJsonData(saveDataPath)[message.author.id]["level"]
  );
}

function checkSaveExists(message) {
  if (!getJsonData(saveDataPath).hasOwnProperty(message.author.id)) {
    return false;
  }
  return true;
}

/*
Train command gives player free exp, between 5% - 10% of their xpToNextLevel.
*/
function train(message) {
  var authorId = message.author.id;
  var trainingCooldown = getJsonData(cooldownsPath)[authorId]["train"];

  if (Date.now() < trainingCooldown) {
    let remainingTime = humanizeDuration(trainingCooldown - Date.now());
    message.channel.send(
      "You've already trained your butt off today " +
        mentionUser(authorId) +
        "! Train again in " +
        remainingTime
    );
  } else {
    let currentSaveData = getJsonData(saveDataPath);
    let cooldowns = getJsonData(cooldownsPath);

    // The minimum xp gain is 5% of your xp needed to level up.
    let minXpGain = parseInt(currentSaveData[authorId]["xpToNextLevel"]) * 0.05;
    // The maximum xp gain is 10% of your xp needed to level up.
    let maxXpGain = parseInt(currentSaveData[authorId]["xpToNextLevel"]) * 0.1;
    let xpGain =
      parseInt(currentSaveData[authorId]["currentXP"]) +
      getRandomInt(minXpGain, maxXpGain);
    currentSaveData[authorId]["currentXP"] = xpGain;
    writeJson(saveDataPath, currentSaveData);

    // They can train again in 24 hours.
    cooldowns[authorId]["train"] = Date.now() + 86400000;
    writeJson(cooldownsPath, cooldowns);

    message.channel.send(
      "You've done your training for the day " +
        mentionUser(authorId) +
        "! You've gained " +
        xpGain +
        "XP."
    );
  }
}

/*
Work command will give money, calculated based on a formula with your level.
*/
function work(message) {
  var authorId = message.author.id;
  var workCooldown = getJsonData(cooldownsPath)[authorId]["work"];

  if (Date.now() < workCooldown) {
    let remainingTime = humanizeDuration(workCooldown - Date.now());
    message.channel.send(
      "No one is looking for work right now " +
        mentionUser(authorId) +
        ". Come check back in " +
        remainingTime +
        " for some work!"
    );
  } else {
    let currentSaveData = getJsonData(saveDataPath);
    let cooldowns = getJsonData(cooldownsPath);

    let minMoneyGain = 10;
    let maxMoneyGain = 50;
    let moneyGain = getRandomInt(minMoneyGain, maxMoneyGain);
    currentSaveData[authorId]["money"] = moneyGain;
    writeJson(saveDataPath, currentSaveData);

    // 30 minutes between working
    cooldowns[authorId]["work"] = Date.now() + 1800000;
    writeJson(cooldownsPath, cooldowns);

    message.channel.send(
      "You did some work for the townspeople " +
        mentionUser(authorId) +
        "! You've earned $" +
        moneyGain +
        "."
    );
  }
}

function adventureSwitch(message, args) {
  switch (args[1]) {
    case "start":
      adventureStart(message, args[2]);
      break;

    case "status":
      adventureStatus();
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
      partyJoin(message);
      break;

    case "invite":
      partyInvite(message);
      break;
  }
}

function partyCreate(message, args) {
  let playerSave = getJsonData(saveDataPath);
  let playerSavePartyId = playerSave[message.author.id]["partyId"];

  if (isNull(playerSavePartyId)) {
    let newPartyId = getRandomInt(0, 10000);
    writeJson(playerPartiesPath, createNewParty(newPartyId, message.author.id));

    playerSave[message.author.id]["partyId"] = newPartyId;
    writeJson(saveDataPath, playerSave);

    message.channel.send("New party has been created with id: " + newPartyId);
  } else {
    message.channel.send(
      "You're already in a party with id: " + playerSavePartyId
    );
  }
}

function partyView(message) {
  let playerParty = getJsonData(saveDataPath);
  let playerPartyId = playerParty[message.author.id]["partyId"];

  let party = getJsonData(playerPartiesPath);
  let members = party[playerPartyId]["members"];
  console.log(members);

  var printStr = "The current members of your party consist of: ";
  for (var i = 0; i < members.length; i++) {
    printStr += mentionUser(members[i]) + ", ";
  }
  message.channel.send(printStr);
}

function partyLeave(message) {}

function partyJoin(message, targetPlayer) {}

function partyInvite() {}

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

  //check if the adventure the player is embarking on exists
  if (
    isNull(adventureArgument) ||
    !getJsonData(adventureDataPath).hasOwnProperty(adventureArgument)
  ) {
    message.channel.send("Please enter a valid adventure ID.");
    return;
  }

  console.log("attemping to start an adventure");

  let authorId = message.author.id;

  let partyId = getJsonData(saveDataPath)[authorId]["partyId"];
  let playerParty = getJsonData(playerPartiesPath);

  if (!isNull(partyId)) {
    console.log("partyid: " + partyId);

    //get the adventure ID from party
    let partyAdventureId;

    try {
      partyAdventureId = playerParty[partyId]["adventureId"];
    } catch (err) {}

    if (isNull(partyAdventureId)) {
      console.log("party adventure id is null, can start a new adventure");

      //get adventure data (can move into createNewAdventure())
      let adventureDuration = getJsonData(adventureDataPath)[adventureArgument][
        "duration"
      ];
      let newAdventureId = getRandomInt(1, 1000);

      //write new adventure into playerAdventures
      writeJson(
        playerAdventuresPath,
        createNewAdventure(
          newAdventureId,
          adventureArgument,
          parseInt(adventureDuration) + Date.now()
        )
      );

      message.channel.send(
        "Started a new adventure for " +
          mentionUser(authorId) +
          " on adventure id: " +
          newAdventureId +
          "!"
      );

      //Overwrite adventure id in party id
      playerParty[partyId]["adventureId"] = newAdventureId;
      writeJson(playerPartiesPath, playerParty);
    } else {
      message.channel.send("Already on an adventure, id: " + partyAdventureId);
    }
  } else {
    message.channel.send("Join a party first");
  }
}

function adventureStatus() {
  //get party id from player info
  //get player adventure id from party id
  //use player adventure id to check adventures.json and see if it exists
  //if not exists
  //throw error
  //else if exists
  //see if global time is later than set completion time
  //if not
  //print how long until adventure is finished
  //else
  //adventure is ready for completion, use complete (or just do automatically)
}

function adventureComplete(message) {
  let partyId = getJsonData(saveDataPath)[message.author.id]["partyId"];
  let party = getJsonData(playerPartiesPath);

  if (!isNull(partyId)) {
    let adventureId = party[partyId]["adventureId"];

    if (!isNull(adventureId)) {
      let adventure = getJsonData(playerAdventuresPath);
      var completionTime = getJsonData(playerAdventuresPath)[adventureId][
        "completion"
      ];

      if (Date.now() < completionTime) {
        let remainingTime = humanizeDuration(completionTime - Date.now());
        message.channel.send(
          "You haven't completed your adventure yet. Complete in: " +
            remainingTime
        );
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
      message.channel.send("You're not on an adventure.");
    }
  } else {
    message.channel.send("You're not even in a party.");
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
    //Update player balance and add to their inventory
    message.channel.send(`${playerName}'s Wallet: $${player.money}`);
    player.money -= item.cost;

    message.channel.send(
      `${playerName} bought a ${item.name} for $${item.cost}!`
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
      let newItem = { name: item.name, cost: item.cost, quantity: 1 };
      player.inventory.push(newItem);
    }

    //Update Balance
    message.channel.send(`${playerName}'s Wallet: $${player.money}`);

    writeJson(saveDataPath, players);
  } else {
    message.channel.send(`${playerName}'s Wallet: $${player.money}`);
    message.channel.send(
      `POVO alert! y'all ain't getting y'all dirty ass hands on this ${item.name}!`
    );
  }
}

bot.login(token);

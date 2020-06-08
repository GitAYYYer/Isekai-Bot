const utils = require("./isekaiUtils.js");

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
    let shop = utils.getJsonData(utils.shopPath);
    var shopItems = "Shop Items:\n";
    for (let i = 0; i < shop.items.length; i++) {
        shopItems += `${shop.items[i].name}  $${shop.items[i].cost}\n`;
    }
    message.channel.send(shopItems);
}

//Shop buy purchases the item from the shop and adds it to your inventoy.
//Update player's money & inventory
function shopBuy(message, itemName) {
    let players = utils.getJsonData(utils.saveDataPath);
    let player;
    let playerName = utils.mentionUser(message.author.id);
    let shop = utils.getJsonData(utils.shopPath);
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

        utils.writeJson(utils.saveDataPath, players);
    } else {
        message.channel.send(`${playerName}'s Wallet: $${player.money}`);
        message.channel.send(`Sorry you don't have enough money to buy a ${item.name}. :(`);
    }
}

module.exports = {shopSwitch, shopBuy};

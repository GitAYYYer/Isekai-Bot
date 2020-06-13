const utils = require("./isekaiUtils.js");

const dungeon = (message, args) => {
    switch (args[1]) {
        //Returns a list of dungeons available to be taken by the user who sent the message
        case "list":
            dungeonList(message);
            break;

    }
};

//Hardcode entire dungeon in dungeon.js for now
const dungeonList = () => {
    let dungeons = utils.getJsonData(utils.dungeonPath);
    
    message.channel.send()
}
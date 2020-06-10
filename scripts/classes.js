const utils = require("./isekaiUtils.js");

const classesSwitch = (message, args) => {
    switch (args[1]) {
        case "change":
            classChange(message, args[2]);
            break;

        case "help":
            help(message);
            break;

        default:
            message.channel.send(`Looks like you're missing an extra argument, ${utils.mentionUser(message.author.id)}. Try typing ${utils.prefix}class help for more info.`);
            break;
    }
}

/* 
classArg is the class that the player wants to change to.
Check if it exists, then if the player meets the requirements.
*/
function classChange(message, classArg) {
    // If the classArg is not given (undefined)
    if (classArg == 'undefined') {
        message.channel.send(`Try typing in a class to change class, ${utils.mentionUser(authorId)}!`);
        return;
    }

    const authorId = message.author.id;
    const allClasses = utils.getJsonData(utils.classesPath);

    if (!allClasses.hasOwnProperty(classArg)) {
        message.channel.send(`Sorry ${utils.mentionUser(authorId)}, the class '${classArg}' does not exist.`);
        return;
    }

    //TODO Implement the classes requirements (a.k.a you cannot become X class without having some form of experience in Y class).

    let currentSaveData = utils.getJsonData(utils.saveDataPath);
    currentSaveData[authorId]['currentClass'] = classArg;
    utils.writeJson(utils.saveDataPath, currentSaveData);

    message.channel.send(`${utils.mentionUser(authorId)} has changed to the ${classArg} class!`);
}

/*
Should probably give a brief info on how classes work in this game,
then list all methods associated with class.
*/
function help(message) {
    message.channel.send(`havent done yet lul`);
}

module.exports = {classesSwitch}
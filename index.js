// discord imports
const Discord = require('discord.js');
const bot = new Discord.Client();
const configFile = require('./config.json');

// regular imports
const fs = require('fs');

// config files
const token = configFile.token;
const prefix = configFile.prefix;

// save related
const saveDataPath = './saveData.json';

bot.on('ready', () => {
    console.log('Bot is online.')

    if (fs.existsSync(saveDataPath)) {
        console.log('SaveData exists.');
    } else {
        console.log('SaveData does not exist.')
    }
})

bot.on('message', message => {

    if (!message.content.startsWith(prefix))
        return;
        
    let args = message.content.slice(prefix.length).split(' ');

    switch (args[0].toLowerCase()) {
        case 'start':
            // Not sure benefit of exists vs existsSync, and with appendFile vs appendFileSync
            if (!fs.existsSync(saveDataPath)) {
                fs.appendFileSync('./saveData.json', '{"player": {"level": 0, "name": "name"}}', function (err) {
                    if (err) throw err
                    console.log("Save data created!")
                });
            }
            break;
        case 'ping':
            message.channel.send('don\'t ping me you fuck')
            break;
        case 'help':
            message.channel.send('there ain\'t shit here')
            break;
        case 'ratemywaifu':
            switch (args[1].toLowerCase()) {
                case 'endorsi':
                    message.channel.send('widepeepohappy')
                    break;
                default:
                    message.channel.send('garbo')
            }
        case 'prefix':
            message.channel.send('current prefix is: ' + prefix)
            break;
    }
})

bot.login(token);


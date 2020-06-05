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
                    if (err) throw err;
                    console.log('saved!');
                });
            }
            break;
        case 'up':
            console.log('up command')
            let currentSaveData = JSON.parse(fs.readFileSync(saveDataPath, 'utf-8'));
            currentSaveData['player']['level'] = (parseInt(currentSaveData['player']['level']) + 1);
            JSON.parse(fs.readFileSync(saveDataPath, 'utf-8')).level = parseInt(JSON.parse(fs.readFileSync(saveDataPath, 'utf-8')).level) + 1;
            fs.writeFileSync(saveDataPath, JSON.stringify(currentSaveData, null, 2), function writeJSON(err) {
                if (err) throw err;
            });
            break;
        case 'display':
            console.log('displaying level');
            let saveDataFile = JSON.parse(fs.readFileSync(saveDataPath, 'utf-8'));
            message.channel.send('Current level is: ' + saveDataFile['player']['level']);
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


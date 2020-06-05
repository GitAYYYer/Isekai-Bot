const Discord = require('discord.js');
const bot = new Discord.Client();
const configFile = require('./config.json');

const token = configFile.token;
const prefix = configFile.prefix;

bot.on('ready', () => {
    console.log('Bot is online.')
})

bot.on('message', message => {

    let args = message.content.substring(prefix.length).split(" ");

    switch (args[0].toLowerCase()) {
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


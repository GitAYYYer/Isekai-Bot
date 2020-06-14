const utils = require("./isekaiUtils.js");
const jikanjs = require('jikanjs'); // Uses per default the API version 3

function gachaRoll(message) {
    try {
        id = utils.getRandomInt(1, 41000); //some IDs will 404
        jikanjs.loadCharacter(id).then((response) => {

            // console.log(response);
            let url = response.image_url;
            message.channel.send(`You rolled ${response.name}`,{files: [url]});
        });

    } catch (err) {
        console.log(err);
    }
}


module.exports = {gachaRoll};

const path = require('path');
const credentials = require(path.join(__dirname, 'credentials.js'));

const Rollbar = require('rollbar');
const rollbar = new Rollbar(credentials.rollbar);

function log(owner) {
    return (msg, level) => {
        rollbar[level.toLowerCase()](msg);
        let owner_tag = ('<' + owner + '>').padEnd(14);
        console.log(owner_tag + level.toUpperCase() + ': ' + msg);
    }
}

module.exports = {
    log: log
}

const path = require('path');
const credentials = require(path.join(__dirname, 'credentials.js'));

const Rollbar = require('rollbar');
const rollbar = new Rollbar(credentials.rollbar);

const crypto = require('crypto');

function log(owner) {
    return (msg, level) => {
        rollbar[level.toLowerCase()](msg);
        let owner_tag = ('<' + owner + '>').padEnd(14);
        console.log(owner_tag + level.toUpperCase() + ': ' + msg);
    }
}

function weblog() {
    return (msg, ip) => {
        console.log(ip + ' @ ' + new Date() + ': ' + msg);
    }
}

module.exports = {
    log: log,
    weblog: weblog,
}

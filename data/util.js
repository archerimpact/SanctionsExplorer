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
        let user = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
        console.log(user + ' @ ' + new Date() + ': ' + msg);
    }
}

module.exports = {
    log: log,
    weblog: weblog,
}

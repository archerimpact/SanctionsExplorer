const path = require('path');
const credentials = require(path.join(__dirname, 'credentials.js'));

const Rollbar = require('rollbar');
const rollbar = new Rollbar(credentials.rollbar);

function log(owner) {
    return (msg, level) => {
        let reporters = {
            'error':   rollbar.error;
            'debug':   rollbar.info;
            'warning': rollbar.warning;
            'info':    rollbar.info;
        };
        let f = reporters[level] || reporter.info;
        f(msg);

        let owner_tag = ('<' + owner + '>').padEnd(14);
        console.log(owner_tag + level.toUpperCase() + ': ' + msg);
    }
}

module.exports = {
    log: log
}

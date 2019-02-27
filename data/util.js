const path = require('path');
const credentials = require(path.join(__dirname, 'credentials.js'));
const Sentry = require('@sentry/node');

Sentry.init({
    dsn: credentials.sentry,
    integrations: integrations => {
        return integrations.filter(integration => integration.name !== 'Console');
    }
 });


function log(owner) {
    return (msg, level) => {
        if (level == 'error' || level == 'critical') {
            if (typeof msg == 'string') {
                Sentry.captureException({ [msg]: 'error' });        // we want each error message to be a unique entry in Sentry
            }
            else {
                Sentry.captureException(msg);
            }
        }
        else {
            Sentry.addBreadcrumb({
                category: owner,
                message: msg,
                level: level,
            });
        }

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

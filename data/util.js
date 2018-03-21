function log(owner) {
	return (msg, level) => {
		let owner_tag = ('<' + owner + '>').padEnd(14);
		console.log(owner_tag + level.toUpperCase() + ': ' + msg);
	}
}

module.exports = {
	log: log
}

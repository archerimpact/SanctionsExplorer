'use strict';

const fs = require('fs');
const path = require('path');
const exporter = require(path.join(__dirname, 'elastic_export.js'));

const entries = JSON.parse(fs.readFileSync(path.join(__dirname, 'update_files/press_releases.json'), 'utf8'));

exporter.reload_index(entries, 'pr', 'pr');

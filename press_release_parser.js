'use strict';

const fs = require('fs');
const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');
const async = require('async');
mongoose.connect('mongodb://localhost/press-releases');

const prSchema = mongoose.Schema({
    title:String,
    link:String,
    date:String,
    content:String
});

prSchema.plugin(mongoosastic);
let PR = mongoose.model('PR', prSchema);


let mongooseModel = PR;
shipFromFile('press_release_json.txt', mongooseModel);
sync(mongooseModel);


function sync(model) {
    let stream = model.synchronize();
    var count = 0;

    stream.on('data', (err, doc) => count++);
    stream.on('close', () => console.log('Indexed ' + count + ' document'));
    stream.on('error', (err) => console.log(err));
}


function shipFromFile(filename, model) {
    fs.readFile(filename, 'utf8', (err, data) => {
        let json = JSON.parse(data);
        shipToDB(json, model);
    });
}

function shipToDB(json_data, model) {
    console.log("# keys: " + Object.keys(json_data).length);

    for (var i = 0; i < json_data.length; i++) {
        console.log('Shipping document ' + i);
        let newEntry = new model(json_data[i]);
        newEntry.save((err) => {
            if (err) {
                console.log(err);
            }
        });
    }
}

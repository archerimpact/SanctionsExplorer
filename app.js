var express = require('express'),
    app = express();

app.get('/', function(req, res) {
    res.send('home');
});

app.get('/search', function(req, res) {
   res.send('search'); 
});

app.get('/view', function(req, res) {
   res.send('view'); 
});

app.listen(process.env.PORT, process.env.IP, function() {
    console.log("Server has started");
});
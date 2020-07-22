require('./index.js'); // bot file

const express = require('express');
const app = express();

app.get('/', (req,res) => res.sendStatus(200));

let listener = app.listen(process.env.PORT, function() {
 console.log(`Listening to ${listener.address().port}`);
});

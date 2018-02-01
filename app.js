
var express = require('express');
var app = express();
var port = 3000;


app.use(express.static('public'));
app.use(express.static('src/views'));

app.get("/", (req,res)=>{
    res.send("Hello world");
});

app.get("/games", (req,res)=>{
    res.send("Top 10 games");
});

app.listen(port, e=>{
    console.log("Server is running");
});
var http = require('http');
var path = require('path');
var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var passport = require('passport');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var url = "mongodb://localhost:27017/";

var app = express();

app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'ejs');

//var entries = [];

//app.locals.entries = entries;

app.use(logger("dev"));

app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser());
app.use(session({
    secret:"secretSession",
    resave:true,
    saveUninitialized:true 
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done){
    done(null, user)
});

passport.deserializeUser(function(user, done){
    done(null, user)
});

LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy({
    usernameField:'',
    passwordField:'',
    },
    function(username, password, done){
        MongoClient.connect(url, function(err, db){
            if(err)throw err;

            var dbObj = db.db("users");

            dbObj.collection("users").findOne({username:username}, function(err, results){
                if (results.password === password){
                    var user = results;
                    done(null, user);
                }
                else{
                    done(null, false, {message:'Bad password!'});
                }
                
            });
        });
}));

function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        next();
    }
    else{
        res.redirect("/sign-in");
    }
}

app.get("/", ensureAuthenticated, function(req, response){
    MongoClient.connect(url, function(err, db){
        if(err) throw err;
        var dbObj = db.db("games");

        dbObj.collection("games").find().toArray(function(err, res){
            console.log("Site served!");
            db.close();
            response.render("index", {games:res});
        });
    });
});


app.get("/index", function(req, res){
    res.render("index");
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/sign-in");
});

app.get("/new-entry", ensureAuthenticated, function(req, res){
    res.render("new-entry");
});

app.get("/sign-in", function(req, res){
    res.render("sign-in");
});

app.post("/new-entry", function(req, res){
    if(!req.body.title || !req.body.body){
        res.status(400).send("Entries must have some text!");
        return;
    }

    MongoClient.connect(url, function(err, db){
        if(err) throw err;

        var dbObj = db.db("games");

        dbObj.collection("games").save(req.body, function(err, result){
            console.log("Data saved!");
            db.close();
            res.redirect("/");
        });

    });
});

app.post("/sign-up", function(request, response){
    console.log(request.body);
     MongoClient.connect(url, function(err, db){
        if(err) throw err;
        var dbObj = db.db("users");

        var user = {
            username: request.body.username,
            password: request.body.password
        };

        dbObj.collection('users').insert(user, function(err, results){
            if(err) throw err;
            request.login(request.body, function(){
                response.redirect('/profile');
            });
        });

     });
});

app.post("/sign-in", passport.authenticate('local', {
    failureRedirect:'/sign-in'
    }), function(request, response){
        response.redirect('/');
    });

app.get('/profile', function(request, response){
    response.json(request.user);
});
app.use(function(req, res){
    res.status(404).render("404");
});

http.createServer(app).listen(3000, function(){
    console.log("Game library server started on port 3000");
});
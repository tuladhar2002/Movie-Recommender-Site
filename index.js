import dotenv from "dotenv";
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import googleStrategy from "passport-google-oauth20";
import findOrCreate from "mongoose-findorcreate";
import facebookStrategy from "passport-facebook";


const GoogleStrategy = googleStrategy.Strategy;
const FacebookStrategy = facebookStrategy.Strategy;
const app = express();
const port = 3000;

const movieDB_API_accessToken = process.env.movieDB_API_accessToken;
const reqMovieDetails_url = process.env.reqMovieDetails_url;
const remaining_url = process.env.remaining_url;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: "MovieDBS",
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());


// connect to dbs with name moviesDB or if not exists, it creates the dbs.
mongoose.connect(process.env.mongoDB_connect); 

//create a schema for how data is to be structured inside dbs
const userSchema = new mongoose.Schema ({
    name: String,
    username: String,
    email: String,
    password: String,
    history: String,
    favourites: String,
    googleId: String,
    facebookId: String,
    active: Boolean,
});

userSchema.plugin(passportLocalMongoose, {usernameField: "email"}); //only for mongoose schema for hashing and salting
userSchema.plugin(findOrCreate);

//create collection that will use the format as initialized in movieSchema
const User = mongoose.model("User", userSchema )

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
//passport.js way of serialize deserializa
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
});
  
passport.deserializeUser(function(user, cb) {
process.nextTick(function() {
    return cb(null, user);
});
});

//oauth20
passport.use(new GoogleStrategy({
    clientID: process.env.oauth_clientID,
    clientSecret: process.env.oauth_clientSecret,
    callbackURL: "http://localhost:3000/auth/google/Movies",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.facebook_appID,
    clientSecret: process.env.facebook_appSecret,
    callbackURL: "http://localhost:3000/auth/facebook/Movies"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


//functions for various methods 


//function for footer copyrights year
function getDate(){
    const current_year = new Date().getFullYear();
    return current_year; 
};

//home page 
app.get("/", (req, res)=>{ //main gateway
    if(req.isAuthenticated()){
        res.render("index.ejs");
    }else{
        res.render("login.ejs");
    };
});

//after user searches for a movie
app.post("/Movie", async(req,res)=>{
    //get requested movie from user
    const requestedMovie = req.body.movieName;


    //we create a fruit obj to insert or save in the dbs
   

    //print out full url for the req to API
    console.log(reqMovieDetails_url+requestedMovie+remaining_url);

    //API req for user requested movie
    const response = await axios.get(reqMovieDetails_url+requestedMovie+remaining_url,{
        headers:{
          Authorization: `Bearer ${movieDB_API_accessToken}`,
        },
      });
    const returned_dataSet = response.data.results;
    // console.log(returned_dataSet);

    var total_results;
    if(response.data.total_results >= 12){
        total_results = 12;
    }else{
        total_results = response.data.total_results;
    }

    var image_url = "https://image.tmdb.org/t/p/original"
    //get movie titles
    const titles = [];
    const posters = [];
    var iterator = 0; // iterator to only have 12 elements in the first page

    for (var movie of returned_dataSet){
        if (iterator <= 12){
            var poster_url;
            titles.push(movie.original_title);
            if(movie.poster_path){
                poster_url = image_url + movie.poster_path;
                const testImage = await axios.get(poster_url,{
                    headers:{
                    Authorization: `Bearer ${movieDB_API_accessToken}`,
                    },
                    responseType: 'arraybuffer',
                });
                const imageBuffer = Buffer.from(testImage.data);
                const base64Image = imageBuffer.toString('base64');
                posters.push(base64Image);  
            } else{
                poster_url = "No Poster Available" 
                posters.push(poster_url);
            }
        }
        iterator++;
    };

    
    //render after we get response
    res.render("movie_result_page.ejs",{
        total_results: total_results,
        titles: titles,
        posters: posters,
        current_year: getDate(),
    });
    
});
// <----register---->
app.get("/register", async(req, res)=>{
    res.render("register.ejs");
});
app.post("/register", async(req, res)=>{
    const name = req.body.fName + " "+ req.body.lName;
    const username = req.body.userName;
    const email = req.body.email;
    const password = req.body.password;
    
    //registering and authenticating cookie session
    User.register({name:name, username: username, email: email}, password, function(err, user){ //registering user cookie seesion
        if(err){
            console.log(err);
        } else {
            res.render("login.ejs");
        };
   });
});



// <----- login ------->
app.get("/failure", async(req, res)=>{
    res.render("login.ejs", {
        failure_response: "Invalid Username or Password",
    });
});


app.post("/login", async (req, res) => {
    const user = new User({
        email: req.body.email,
        password: req.body.password,
    });

    req.login(user, function (err) {
        if (err) {
            console.log("An error occurred during login:");
            console.log(err);
            res.redirect("/failure"); // Redirect to a login page or any other appropriate page
        } else {
            passport.authenticate('local', {failureRedirect: '/failure', failureMessage: true })(req,res, function(){
                res.redirect("/home");
            });
        }
    });
});

    

     
   
           
           
   
app.get("/home", (req, res)=>{
    if(req.isAuthenticated()){ //if alrwady authenticated or logged in, simply renders secrets 
        res.render("index.ejs");
    } else {
        res.render("login.ejs"); //if not authenticated login first
    };
});

// <---oauth------>>
app.get("/auth/google", passport.authenticate('google', {
 
    scope: ['profile']
 
}));

app.get("/auth/facebook", passport.authenticate('facebook'));

//redirect from google response roue
app.get('/auth/google/Movies', 
  passport.authenticate('google', { failureRedirect: "/failure" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
});

app.get('/auth/facebook/Movies',
  passport.authenticate('facebook', { failureRedirect: '/failure' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
});

app.get("/logout", (req, res)=>{
    req.logout(function(err) {
    if (err) { return next(err); }
        res.redirect("/");
    });
});

app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
});
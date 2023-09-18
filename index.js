import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;

const movieDB_API_accessToken = process.env.movieDB_API_accessToken;
const reqMovieDetails_url = process.env.reqMovieDetails_url;
const remaining_url = process.env.remaining_url;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// connect to dbs with name moviesDB or if not exists, it creates the dbs.
mongoose.connect("mongodb://localhost:27017/moviesDB", { useNewUrlParser: true}); 

//create a schema for how data is to be structured inside dbs
const movieSchema = new mongoose.Schema ({
    name: String,
});

//create collection that will use the format as initialized in movieSchema
const Movie = mongoose.model("Movie", movieSchema )

//functions for various methods 


//function for footer copyrights year
function getDate(){
    const current_year = new Date().getFullYear();
    return current_year; 
}

//home page 
app.get("/", (req, res)=>{
    res.render("index.ejs",{
        current_year: getDate(),
    });
});

//after user searches for a movie
app.post("/Movie", async(req,res)=>{
    //get requested movie from user
    const requestedMovie = req.body.movieName;


    //we create a fruit obj to insert or save in the dbs
    var movie = new Movie({
        name: requestedMovie,
    });
    movie.save();

    //print out full url for the req to API
    console.log(reqMovieDetails_url+requestedMovie+remaining_url);

    //API req for user requested movie
    const response = await axios.get(reqMovieDetails_url+requestedMovie+remaining_url,{
        headers:{
          Authorization: `Bearer ${movieDB_API_accessToken}`,
        },
      });
    const returned_dataSet = response.data.results;
    console.log(returned_dataSet);

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
app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
});
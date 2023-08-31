import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;

const movieDB_API_accessToken = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2ZTM0NDM4MDVmOTBjY2RhYTliYjlmYTZkYzY1MjA4NiIsInN1YiI6IjY0ZTgyOGExNTI1OGFlMDBhZGQ0NTE2NyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.T9I7J-d5RbEO17cyx6H27zKifMNIiEmjTCzr2DxxHRo";
const reqMovieDetails_url = "https://api.themoviedb.org/3/search/movie?query=";
const remaining_url = "&include_adult=false&language=en-US&page=1";

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

//functions for various methods 

//get movie title from the API and return it in array format
function getMovieTitle(movies){
    const movie_titles = [];
    for(var movie in movies){
        movie_titles.push(movie.original_title);
    }
    return movie_titles;
}


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
    console.log(requestedMovie);

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
    for (var movie of returned_dataSet){
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
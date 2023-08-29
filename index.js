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

app.get("/", (req, res)=>{
    res.render("index.ejs");
});
app.post("/Movie", async(req,res)=>{
    const requestedMovie = req.body.movieName;
    console.log(requestedMovie);
    console.log(reqMovieDetails_url+requestedMovie+remaining_url);
    const response = await axios.get(reqMovieDetails_url+requestedMovie+remaining_url,{
        headers:{
          Authorization: `Bearer ${movieDB_API_accessToken}`,
        },
      });
    const returned_dataSet = response.data;
    console.log(returned_dataSet);
    console.log(returned_dataSet.total_results);
    
    res.render("movie_result_page.ejs",{
        total_results: returned_dataSet.total_results,
    });
    //   res.render("index.ejs",{content: JSON.stringify(response.data)});
});
app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
});
const express = require("express");

/* Import a body parser module to be able to access the request body as json */
const bodyParser = require("body-parser");

/* Use cors to avoid issues with testing on localhost */
const cors = require("cors");

const app = express();

/* Base url parameters and port settings */
const apiPath = "/api/";
const version = "v1";
const port = 3000;

/* Set Cors-related headers to prevent blocking of local requests */
app.use(bodyParser.json());
app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

/* Initial Data */
const songs = [
  { id: 1, title: "Cry For Me", artist: "The Weeknd" },
  { id: 2, title: "Busy Woman", artist: "Sabrina Carpenter" },
  {
    id: 3,
    title: "Call Me When You Break Up",
    artist: "Selena Gomez, benny blanco, Gracie Adams",
  },
  { id: 4, title: "Abracadabra", artist: "Lady Gaga" },
  { id: 5, title: "Róa", artist: "VÆB" },
  { id: 6, title: "Messy", artist: "Lola Young" },
  { id: 7, title: "Lucy", artist: "Idle Cave" },
  { id: 8, title: "Eclipse", artist: "parrow" },
];

const playlists = [
  { id: 1, name: "Hot Hits Iceland", songIds: [1, 2, 3, 4] },
  { id: 2, name: "Workout Playlist", songIds: [2, 5, 6] },
  { id: 3, name: "Lo-Fi Study", songIds: [] },
];

/*  Our id counters
    We use basic integer ids in this assignment, but other solutions (such as UUIDs) would be better. */
let nextSongId = 9;
let nextPlaylistId = 4;

/* --------------------------

        SONGS ENDPOINTS     

-------------------------- */

// get all songs
app.get(`${apiPath}${version}/songs`,(req, res)=> {
  const filter =req.query.filter;
  let results = songs; // default return all songs

  if (filter){
    results=songs.filter(song =>
      song.title.toLowerCase().includes(filter.toLowerCase())|| // song title
      song.artist.toLowerCase().includes(filter.toLowerCase()) // artists name
    );
  }
  res.json(results); // Returning as a json
});


// Add a new song
app.post (`${apiPath}${version}/songs`, (req, res) =>{
  const { title, artist }=req.body; // gets the title and artist

  // Needs a title and an artist
  if(!title|| !artist){
    return res.status(400).json({error:"A Title and Artist are required"})
  }

  // Making an new song with a new id
  const newSong={id: nextSongId++, title, artist};
  songs.push(newSong); // adding the song to the list
  res.status(201).json(newSong); // returns the added song as json
});


// update a song
app.patch(`${apiPath}${version}/songs/:id`, (req,res) => {
  const {id} = req.params; // takes the id in the link
  const {title,artist} = req.body;

  // finds the song
  const song =songs.find(song => song.id==id);
  if (!song){
    return res.status(404).json({error: "Song not found"}) // if it doesn't then it returns an error
  }

  // updating the values
  if (title) song.title=title;
  if (artist) song.artist=artist;

  res.json(song); // Returns the song that was updated as json
});

// Delete a song by ID
app.delete(`${apiPath}${version}/songs/:id`, (req,res) => {
  const{id}=req.params; // takes the id in the link
  const songIndex=songs.findIndex(song => song.id==id); // finds the song through the id

  if (songIndex ===-1){
    return res.status(404).json({error:"song not found"});
  }

  // checking to see if the song is in any playlist
  const isInPlaylist=playlists.some(playlist => playlist.songIds.includes(parseInt(id)));
  if (isInPlaylist){ // if the song is in a playlist then it returns an error
    return res.status(400).json({error:"Cannot delete song, it's in the playlist"}); 

  }
  // Removing the song
  const deletedSong =songs.splice(songIndex,1)[0];

  res.json(deletedSong); // return the deleted song as a json

});

/* --------------------------

      PLAYLISTS ENDPOINTS    

-------------------------- */

// Get all playlists
app.get(`${apiPath}${version}/playlists`, (req, res) => {
  res.json(playlists); // returns playlists as json
});


// Get a playlists details by seaeching for the ID
app.get(`${apiPath}${version}/playlists/:id`, (req, res) =>{
  const playlist =playlists.find(pl=>pl.id ==req.params.id); // find playlist by id
  if(!playlist){
    return res.status(404).json({error:"playlist not found"}); // if it can't find the playlist it returns error

  }

  // Create a detailed playlist object that contains all of the song info
  const detailedPlaylist={
    ...playlist,
    songs:playlist.songIds.map(songId=>songs.find(song=>song.id==songId))
  };
  res.json(detailedPlaylist); // retuirn the playlist detail as a json
});

// To create a new playlist
app.post(`${apiPath}${version}/playlists`, (req, res) => {
  const { name } = req.body;

  if (!name) { // if there is no name then it returns an error
      return res.status(400).json({ error: "Playlist name required" }); // Return error if name is missing
  }

  // Checking if a playlist with the same name already exists
  if (playlists.some(pl => pl.name.toLowerCase() === name.toLowerCase())) {
      return res.status(409).json({ error: "Playlist exists" });
  }

  // Creating an object for the new playlist and gives a new id and can hold song ids
  const newPlaylist = { id: nextPlaylistId++, name, songIds: [] };
  playlists.push(newPlaylist); // Adding the playlist

  res.status(201).json(newPlaylist); // returning the new playlist info as json
});

// Add a song to a playlist
app.post(`${apiPath}${version}/playlists/:id/songs/:songId`, (req, res) => {
  const playlist = playlists.find(pl => pl.id == req.params.id);// Finding playlist by ID in link
  const song = songs.find(s => s.id == req.params.songId); // find song ny the ID in link

  // Needs playlist and song
  if(!playlist || !song) {
    return res.status(404).json({error: "Playlist or song not found"});
  }

  // checking if the song is already in the playlist
  if (playlist.songIds.includes(song.id)){
    return res.status(409).json({ error: "song already in playlist"});
  }

  playlist.songIds.push(song.id); // adding the song to the playlist
  res.json(playlist); // Return the playlist with the added song as json
});

app.patch(`${apiPath}${version}/playlists/:id/songs/:songId`, (req, res) => {
  const playlistId = parseInt(req.params.id);
  const songId = parseInt(req.params.songId);

  const playlist = playlists.find(pl => pl.id === playlistId);
  const song = songs.find(s => s.id === songId);

  if (!playlist || !song) {
      return res.status(404).json({ error: "Playlist or song not found" });
  }

  if (playlist.songIds.includes(song.id)) {
      return res.status(409).json({ error: "Song already in playlist" });
  }

  playlist.songIds.push(song.id);
  res.json(playlist);
});


/* --------------------------

      SERVER INITIALIZATION  
      
!! DO NOT REMOVE OR CHANGE THE FOLLOWING (IT HAS TO BE AT THE END OF THE FILE) !!
      
-------------------------- */
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = app;

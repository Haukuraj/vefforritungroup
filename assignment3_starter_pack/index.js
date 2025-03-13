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
app.get(`${apiPath}${version}/songs`,(req, res)=> {
  const filter =req.query.filter;
  let results = songs;

  if (filter){
    results=songs.filter(song =>
      song.title.toLowerCase().includes(filter.toLowerCase())||
      song.artist.toLowerCase().includes(filter.toLowerCase())
    );
  }
  res.json(results);
});


app.post(`${apiPath}${version}/songs`,(req, res)=>{
  const {title, artist }= req.body;

  if (!title || !artist){
    return res.status(400).json({error:"A title and a Artist are required fields"});

  }
  const exists = songs.some(song =>
    song.title.toLowerCase()===title.toLowerCase()&&
    song.artist.toLowerCase() === artist.toLowerCase()
  );
  if (exists){
    return res.status(409).json({error:"Song exists"});
  }

  const newSong ={id: nextSongId++, title, artist};
  songs.push(newSong);
  res.status(201).json(newSong);
});

app.patch(`${apiPath}${version}/songs/:id`, (req,res) => {
  const {id} = req.params;
  const {title,artist} = req.body;

  const song =songs.find(song => song.id==id);
  if (!song){
    return res.status(404).json({error: "Song not found"})
  }
  if (title) song.title=title;
  if (artist) song.artist=artist;

  res.json(song);
});

app.delete(`${apiPath}${version}/songs/:id`, (req,res) => {
  const{id}=req.params;
  const songIndex=songs.findIndex(song => song.id==id);

  if (songIndex ===-1){
    return res.status(404).json({error:"song not found"});
  }

  const isInPlaylist=playlists.some(playlist => playlist.songIds.includes(parseInt(id)));
  if (isInPlaylist){
    return res.status(400).json({error:"Cannot delete song, it's in the playlist"});

  }
  const deletedSong =songs.splice(songIndex,1)[0];
  res.json(deletedSong);

});

/* --------------------------

      PLAYLISTS ENDPOINTS    

-------------------------- */

app.get(`${apiPath}${version}/playlists`, (req, res) => {
  res.json(playlists);
});

app.get(`${apiPath}${version}/playlists/:id`, (req, res) =>{
  const playlist =playlists.find(pl=>pl.id ==req.params.id);
  if(!playlist){
    return res.status(404).json({error:"playlist not found"});

  }

  const detailedPlaylist={
    ...playlist,
    songs:playlist.songIds.map(songId=>songs.find(song=>song.id==songId))
  };
  res.json(detailedPlaylist);
});


app.post(`${apiPath}${version}/playlists`, (req, res) => {
  const { name } = req.body;

  if (!name) {
      return res.status(400).json({ error: "Playlist name required" });
  }

  if (playlists.some(pl => pl.name.toLowerCase() === name.toLowerCase())) {
      return res.status(409).json({ error: "Playlist exists" });
  }

  // Fix: Corrected variable name & array name
  const newPlaylist = { id: nextPlaylistId++, name, songIds: [] };
  playlists.push(newPlaylist); // Fix: Changed from "playlist" to "playlists"

  res.status(201).json(newPlaylist);
});

app.post(`${apiPath}${version}/playlists/:id/songs/:songId`, (req, res) => {
  const playlist = playlists.find(pl => pl.id == req.params.id);
  const song = songs.find(s => s.id == req.params.songId);

  if(!playlist || !song) {
    return res.status(404).json({error: "Playlist or song not found"});
  }

  if (playlist.songIds.includes(song.id)){
    return res.status(409).json({ error: "song already in playlist"});
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

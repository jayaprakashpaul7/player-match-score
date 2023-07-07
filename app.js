const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const port = 3000;
const express = require("express");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(port, () => {
      console.log("server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();
const convertplayer = (each) => {
  return {
    playerId: each.player_id,
    playerName: each.player_name,
  };
};

app.get("/players/", async (req, res) => {
  const getPlayers = `
    SELECT * FROM player_details;`;
  const dbRes = await db.all(getPlayers);
  res.send(dbRes.map((each) => convertplayer(each)));
});

//get
app.get("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const getPlayerDetails = `
    SELECT * FROM player_details
     WHERE player_id=${playerId};`;
  const dbResponse = await db.get(getPlayerDetails);
  res.send(convertplayer(dbResponse));
});

app.put("/players/:playerId", async (req, res) => {
  const { playerId } = req.params;
  const playerDetails = req.body;
  const { playerName } = playerDetails;
  const addPlayerQuery = `
    UPDATE player_details
    SET
        
       player_name='${playerName}'
    WHERE player_id=${playerId};
    `;
  const dbResponse = await db.run(addPlayerQuery);
  res.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (req, res) => {
  const { matchId } = req.params;
  const getMatchQuery = `
    SELECT match_id as matchId,match,year 
    FROM match_details 
    WHERE match_id=${matchId};
    `;
  const dbResponse = await db.get(getMatchQuery);
  res.send(dbResponse);
});

app.get("/players/:playerId/matches/", async (req, res) => {
  const { playerId } = req.params;
  const getMatchQuery = `
    SELECT match_details.match_id as matchId,
    match, year,score 
    FROM
     match_details NATURAL JOIN player_match_score
     WHERE player_match_score.player_id=${playerId};
    `;
  const dbResponse = await db.all(getMatchQuery);
  res.send(dbResponse);
});

app.get("/matches/:matchId/players", async (req, res) => {
  const { matchId } = req.params;
  const getMatchQuery = `
    
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;

  const dbResponse = await db.all(getMatchQuery);
  res.send(dbResponse);
});

app.get("/players/:playerId/playerScores", async (req, res) => {
  const { playerId } = req.params;
  const getMatchQuery = `
   SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const dbResponse = await db.all(getMatchQuery);
  res.send(dbResponse);
});
module.exports = app;

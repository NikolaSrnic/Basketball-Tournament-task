const fs = require("fs");

// Učitavanje JSON fajlova
const groupsData = JSON.parse(fs.readFileSync("./groups.json", "utf-8"));

// Pomoćne funkcije
function simulateGame(team1, team2) {
  const rankDifference = team1.FIBARanking - team2.FIBARanking;
  const baseScore = 80;

  const score1 = baseScore + Math.floor(Math.random() * 20) - rankDifference;
  const score2 = baseScore + Math.floor(Math.random() * 20) + rankDifference;

  const result = `${score1}:${score2}`;

  return score1 > score2
    ? {
        result,
        winnerScore: score1,
        winner: team1.ISOCode,
        loserScore: score2,
        loser: team2.ISOCode,
      }
    : {
        result,
        winnerScore: score2,
        winner: team2.ISOCode,
        loserScore: score1,
        loser: team1.ISOCode,
      };
}

function simulateGroupPhase(groupsData) {
  const standings = {};

  for (const group in groupsData) {
    const teams = groupsData[group];
    standings[group] = {};

    teams.forEach((team) => {
      standings[group][team.ISOCode] = {
        ...team,
        wins: 0,
        losses: 0,
        points: 0,
        scoredPoints: 0,
        concededPoints: 0,
      };
    });

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];

        const { winnerScore, loserScore, winner, loser } = simulateGame(
          team1,
          team2
        );

        standings[group][winner].scoredPoints += winnerScore;
        standings[group][winner].concededPoints += loserScore;
        standings[group][loser].scoredPoints += loserScore;
        standings[group][loser].concededPoints += winnerScore;

        standings[group][winner].wins++;
        standings[group][loser].losses++;
        standings[group][winner].points += 2;
        standings[group][loser].points += 1;
      }
    }

    standings[group] = Object.values(standings[group]).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const pointDiffA = a.scoredPoints - a.concededPoints;
      const pointDiffB = b.scoredPoints - b.concededPoints;
      if (pointDiffB !== pointDiffA) return pointDiffB - pointDiffA;
      return b.scoredPoints - a.scoredPoints;
    });
  }

  return standings;
}

function prepareEliminationPhase(standings) {
  const matches = [];

  const rankedTeams = [];
  for (const group in standings) {
    rankedTeams.push(...standings[group].slice(0, 3));
  }

  rankedTeams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const pointDiffA = a.scoredPoints - a.concededPoints;
    const pointDiffB = b.scoredPoints - b.concededPoints;
    if (pointDiffB !== pointDiffA) return pointDiffB - pointDiffA;
    return b.scoredPoints - a.scoredPoints;
  });

  const sesirD = rankedTeams.slice(0, 2); // Timovi sa rangom 1 i 2
  const sesirE = rankedTeams.slice(2, 4); // Timovi sa rangom 3 i 4
  const sesirF = rankedTeams.slice(4, 6); // Timovi sa rangom 5 i 6
  const sesirG = rankedTeams.slice(6, 8); // Timovi sa rangom 7 i 8

  matches.push({ team1: sesirD[0], team2: sesirG[1] });
  matches.push({ team1: sesirE[1], team2: sesirF[0] });
  matches.push({ team1: sesirD[1], team2: sesirG[0] });
  matches.push({ team1: sesirE[0], team2: sesirF[1] });

  return matches;
}

function simulateElimination(matches) {
  const results = [];
  let round = 1;

  let thirdPlaceTeams = [];
  let finalTeams = [];

  while (matches.length > 1) {
    const nextRound = [];

    // Dodavanje faza sa odgovarajućim imenima
    if (round === 1) results.push("\nČetvrtfinale:");
    else if (round === 2) results.push("\nPolufinale:");
    else if (round === 3) results.push("\nUtakmica za treće mesto:");
    else if (round === 4) results.push("\nFinale:");

    matches.forEach((match) => {
      const { team1, team2 } = match;
      const { result, winner } = simulateGame(team1, team2);

      results.push(
        `${team1.Team} - ${team2.Team} (${result}) - Pobednik: ${winner}`
      );

      const winnerTeam = team1.ISOCode === winner ? team1 : team2;
      const loserTeam = team1.ISOCode !== winner ? team1 : team2;

      nextRound.push(winnerTeam);

      // U polufinalu, sačuvaj timove koji gube za utakmicu za treće mesto
      if (round === 2) {
        thirdPlaceTeams.push(loserTeam);
      }
    });

    // Ako je polufinale završeno, definiši finaliste
    if (round === 2) {
      finalTeams = [...nextRound];
    }

    // Pripremi sledeću rundu mečeva
    matches = [];
    for (let i = 0; i < nextRound.length; i += 2) {
      matches.push({ team1: nextRound[i], team2: nextRound[i + 1] });
    }

    round++;
  }

  // Simulacija utakmice za treće mesto
  const { result: thirdPlaceResult, winner: thirdPlaceWinner } = simulateGame(
    thirdPlaceTeams[0],
    thirdPlaceTeams[1]
  );

  results.push(`\nUtakmica za treće mesto:`);
  results.push(
    `${thirdPlaceTeams[0].Team} - ${thirdPlaceTeams[1].Team} (${thirdPlaceResult}) - Pobednik: ${thirdPlaceWinner}`
  );

  // Simulacija finalnog meča
  const { result: finalResult, winner: finalWinner } = simulateGame(
    finalTeams[0],
    finalTeams[1]
  );

  results.push(`\nFinale:`);
  results.push(
    `${finalTeams[0].Team} - ${finalTeams[1].Team} (${finalResult}) - Pobednik: ${finalWinner}`
  );

  // Dodavanje osvojenih medalja
  results.push("\nMedalje:");
  results.push(
    `1. ${
      finalWinner === finalTeams[0].ISOCode
        ? finalTeams[0].Team
        : finalTeams[1].Team
    }`
  );
  results.push(
    `2. ${
      finalWinner !== finalTeams[0].ISOCode
        ? finalTeams[0].Team
        : finalTeams[1].Team
    }`
  );
  results.push(
    `3. ${
      thirdPlaceWinner === thirdPlaceTeams[0].ISOCode
        ? thirdPlaceTeams[0].Team
        : thirdPlaceTeams[1].Team
    }`
  );

  return results;
}

// Glavni tok programa
const groupStandings = simulateGroupPhase(groupsData);

console.log("Stanje nakon grupne faze:");
for (const group in groupStandings) {
  console.log(`Grupa ${group}:`);
  groupStandings[group].forEach((team) => {
    console.log(
      `${team.Team}: ${team.wins} pobeda, ${team.losses} poraza, ${team.points} poena`
    );
  });
}

const eliminationMatches = prepareEliminationPhase(groupStandings);
const eliminationResults = simulateElimination(eliminationMatches);

console.log("\nRezultati eliminacione faze:");
eliminationResults.forEach((result) => console.log(result));

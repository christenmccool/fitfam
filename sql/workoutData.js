const fs = require('fs');
const os = require("os");
const axios = require("axios");

const API_KEY = require("../secret");
const SUGARWOD_BASE_URL = "https://api.sugarwod.com/v2";

let urlArr = [
  `${SUGARWOD_BASE_URL}/benchmarks/category/girls`,
  `${SUGARWOD_BASE_URL}/benchmarks/category/heroes`,
  `${SUGARWOD_BASE_URL}/benchmarks/category/games`,
];

async function getAllWorkouts(urlArr) {
  let length = 0;

  for (let url of urlArr) {
    length += await getWorkouts(url, length) + 1;
  }
}

async function getWorkouts(url, prevLength) {
  let skip = 0;
  let length = 0;

  while (true) {
    const res = await axios.get(`${url}?page[skip]=${skip}&page[limit]=25`, 
      { headers: {Authorization: API_KEY} }
    );      
    const workouts =  res.data.data;
    length += workouts.length;

    if (!workouts.length) {
      return length;
    } else {
      let i = 0;
      for (let workout of workouts) {
        const workoutData = {
            id: i + skip + prevLength + 1,
            sw_id: workout.id,
            wo_name: workout.attributes.name,
            wo_description: workout.attributes.description,
            score_type: workout.attributes.score_type,
            category: workout.attributes.category,
            movement_ids: workout.attributes.movement_ids
        };
        const workoutData1 = {...workoutData};
        delete workoutData1.movement_ids;
        fs.appendFile('workouts.json.csv', JSON.stringify(workoutData1) + os.EOL, 'utf8', (err, data) => {
          if (err) {
              console.log(err);
              process.kill(1)
          }
        })
        for (let id of workoutData.movement_ids) {
          let workoutData2 = {wo_id: workoutData.id, movement_id: id};
          fs.appendFile('workoutsMovements.json', JSON.stringify(workoutData2) + os.EOL, 'utf8', (err, data) => {
            if (err) {
                console.log(err);
                process.kill(1)
            }
          })
        }
        i++;
      }
      skip += 25;
    }
  }
}

getAllWorkouts(urlArr);


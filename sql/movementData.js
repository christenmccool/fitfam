const fs = require('fs');
const os = require("os");
const axios = require("axios");

const API_KEY = require("../secret");
const SUGARWOD_BASE_URL = "https://api.sugarwod.com/v2";

let skip = 0;

while (skip < 350) {
  axios.get(`${SUGARWOD_BASE_URL}/movements?page[skip]=${skip}&page[limit]=25`, 
  {
      headers: {Authorization: API_KEY}
  }
  ).then(resp => {
    let data = resp.data.data;

    const movements = data.map(ele => ({
      id: ele.id,
      movement_name: ele.attributes.name,
      youtube_id: ele.attributes.videos[0] ? ele.attributes.videos[0].id : null
    }))

    for (let movement of movements) {
      fs.appendFile('movements.json', JSON.stringify(movement) + os.EOL, 'utf8', (err, data) => {
        if (err) {
            console.log(err);
            process.kill(1)
        }
      })
    }
  }).catch(err => {
    console.log(err);
  })

  skip += 25;
} 



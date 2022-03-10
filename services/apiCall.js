const axios = require("axios");
const moment = require("moment");

const API_KEY = require("../secret");
const SUGARWOD_BASE_URL = "https://api.sugarwod.com/v2";

/** Api Calls class
 *
 * Supplies methods used to get data from the SugarWOD Api
 */
class ApiCall {

  static async getWorkouts(date) {

    let formattedDate = moment(date).format("YYYYMMDD");

    let resp = await axios.get(`${SUGARWOD_BASE_URL}/workouts`, 
      {params: {dates: formattedDate}, headers: {Authorization: API_KEY}}
    );
  
    const data = [];

    for (let wo of resp.data.data) {
      let workout = 
        {
          swId: wo.id,
          name: wo.attributes.title,
          description: wo.attributes.description,
          category: "featured",
          scoreType: wo.attributes.score_type,
          featuredDate: wo.attributes.scheduled_date,
          movementIds: wo.attributes.movement_ids
        }
      data.push(workout);
    }

    return data;
  }

}

module.exports = ApiCall;


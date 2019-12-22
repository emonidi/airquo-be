const fetch = require("node-fetch");
require('dotenv').config();

class Station{
    constructor(){
        this.token = process.env.MAPBOX_TOKEN;
        
    }

    async getStationName(st){
        const {lon,lat} = st;
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${this.token}`)
        const data = await res.json();
        return {
            ...st,
            station:{
                name:data.features[0].place_name
            }
        }
    }
}


module.exports = Station;
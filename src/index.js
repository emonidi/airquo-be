const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const HomeController = require('./routes/home');
const StationController = require('./routes/station');
const app = express();
app.use(cors());

const homeController = new HomeController();
const stationController = new StationController();

homeController.fetchStations();

app.get("/", async function(req, res) {
  res.json(homeController.getStations());
});

app.get("/station/:id", async (req,res)=>{
  try{
    const reqId = req.params.id;
    const stations = homeController.getStations();
    let selectedStation = stations.data.filter((station,i)=>reqId === station.uid)[0]
    if(!selectedStation.station){
      selectedStation = await stationController.getStationName(selectedStation);
    }
    res.json(selectedStation)
  }catch(e){
    console.log(e)
  }
})

app.listen(process.env.PORT || 3000);

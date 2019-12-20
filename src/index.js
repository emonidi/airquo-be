const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const app = express();
app.use(cors());

let stations;

async function getStations() {
  const aqiStations = await getAqiStations();
  const dlStations = await getLDStations(aqiStations.data.length);

  aqiStations.data = [...aqiStations.data, ...dlStations];
  stations = aqiStations;

  setInterval(getStations, 60000);
}

getStations();

app.get("/", async function(req, res) {
  res.json(stations);
});

app.listen(3000);

async function getAqiStations(bounds = [90, 180, -90, -180]) {
  // try {
  //   const res = await fetch(
  //     `https://api.waqi.info/map/bounds/?token=c472110c54ce8941e8a361c36bdbd21613f9ab69&latlng=${bounds.join(
  //       ","
  //     )}`
  //   );
  //   console.log(
  //     `https://api.waqi.info/map/bounds/?token=c472110c54ce8941e8a361c36bdbd21613f9ab69&latlng=${bounds.join(
  //       ","
  //     )}`
  //   );
  //   let data = await res.json();
  //   data.data = data.data.map((el, i) => ({
  //     ...el,
  //     uid: i
  //   }));
  //   return data;
  // } catch (e) {
  //   console.log(e);
  // }
  try {
    const urlRes = await fetch(
      `https://waqi.info/rtdata/?_=${Math.floor(Date.now() / 1000)}`
    );
    console.log(`https://waqi.info/rtdata/?_=${Math.floor(Date.now() / 1000)}`);
    const urlData = await urlRes.json();
    const res = await fetch(
      `https://waqi.info/rtdata/${urlData.path}/000.json`
    );
    let stations = await res.json();
    let data = stations.stations.map((st, index) => {
      return {
        uid: st.x,
        lat: st.g[0],
        lon: st.g[1],
        aqi: parseInt(st.a),
        station: {
          name: st.n,
          time: st.u
        }
      };
    });
    const specieRes = await fetch(`https://api.waqi.info/map/realtime/specie`, {
      method: "POST",
      body: JSON.stringify({ specie: "o3" }),
      headers: {
        // "Content-Type": "application/json"
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    const specie = await specieRes.json();
    console.log(specie);
    return { data };
  } catch (e) {
    console.log(e);
  }
}
async function getLDStations(aqiStationsLength) {
  try {
    const res = await fetch(
      "https://maps.luftdaten.info/data/v2/data.dust.min.json"
    );
    let ldStations = await res.json();
    ldStations = ldStations
      .filter(i => i.sensordatavalues.some(el => el.value_type === "P1"))
      .map((item, index) => {
        return {
          lat: parseFloat(item.location.latitude),
          lon: parseFloat(item.location.longitude),
          uid: aqiStationsLength + index,
          aqi: getP1Value(item, index)
        };
      });
    return ldStations;
  } catch (e) {
    console.log(e);
  }
}

function getP1Value(item, index) {
  const p1 = item.sensordatavalues.filter(el => el.value_type === "P1");
  if (p1[0]) {
    return parseFloat(p1[0].value);
  } else {
    return -1;
  }
}

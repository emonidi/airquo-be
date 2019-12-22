const fetch = require("node-fetch");

class HomeController{
    constructor(){
        this.fetchStations();
    }
    async fetchStations(){
        const aqiStations = await this.getAqiStations();
        const dlStations = await this.getLDStations(aqiStations.data.length);
        aqiStations.data = [...aqiStations.data, ...dlStations];
        this.stations = aqiStations;
      
        this.fetchStations();
    }

    getStations(){
        return this.stations;
    }

    async getAqiStations(bounds = [90, 180, -90, -180]) {
        try {
          const urlData = await this.getUrlRes();
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
          const params = new URLSearchParams();
      
          params.append('specie', 'pm25');
          const specieRes = await fetch(`https://api.waqi.info/map/realtime/specie`, {
            method: "post",
            body: params,
            headers: {
              // "Content-Type": "application/json"
              "Accept": "*/*",
              "Content-Type": "application/x-www-form-urlencoded",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "cross-site",
              "dnt":"1",
              "accept-encoding": "gzip, deflate, br"
            }
          });
          const specie = await specieRes.json();
          let specieObj = {}
          for(let obj in specie.data.values){
            const o = specie.data.values[obj];
            for(let v in o){
                specieObj[v] = parseInt(o[v]);
            }
          }
          
          data = data
          .filter(el => specieObj[el.uid])
          .map((elem,i)=>{
            return{
              ...elem,
              uid:`AQI${elem.uid}`,
              aqi:specieObj[elem.uid] || "-"
            }
          })
          
          return { data };
        } catch (e) {
          console.log(e);
        }
    }

    async getUrlRes(){
        const urlRes = await fetch(
          `https://waqi.info/rtdata/?_=${Math.floor(Date.now() / 1000)}`
        );
        return await urlRes.json()
    }

    async getLDStations(aqiStationsLength) {
        let self = this;
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
                uid: `LD${item.id}`,
                aqi: self.getP1Value(item, index)
              };
            });
          return ldStations;
        } catch (e) {
          console.log(e);
        }
    }

    getP1Value(item, index) {
        const p1 = item.sensordatavalues.filter(el => el.value_type === "P1");
        if (p1[0]) {
          return parseFloat(p1[0].value);
        } else {
          return -1;
        }
    }
}

module.exports = HomeController;
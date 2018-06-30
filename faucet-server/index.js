const express = require('express')
const path = require('path');
const http = require('http');

const BurgerFaucet = require('../burgerFaucet');
var bodyParser = require('body-parser');
var cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());

const PORT =  5555;

const addressTracking ={};

app.get('/faucet/:address', async (req, res) => {
    const address = req.params.address;
    if(!addressTracking[address]){
        try {
            await send(address);
            res.status(200).send("Request accepted!");
        } catch (e) {
            res.status(400).send(e.message);
        }
    }
    else{
        let now = new Date();
        if (Math.abs(addressTracking[address].getTime() - now.getTime())>(1000 * 3600)) {
            await send(address);
            res.status(200).send("Request accepted!");
        }
        else {
            res.status(403).send("Request denied, please try again later.");
        }    
    }
  });

  async function send(address) {
    const burgers = 1000000;
    await BurgerFaucet.sendBurgers(address, burgers);
    let now = new Date();
    addressTracking[address] = now;
  }


server.listen(PORT, () => console.log('Listening on port: ' + PORT));
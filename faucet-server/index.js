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
        addressTracking[address] = new Date();
        const burgers = 1000000;
        await BurgerFaucet.sendBurgers(address, burgers);
        res.send("Request accepted!");
    }
    else{
        //console.log("got here")
        let now = new Date();
        if(Math.abs(addressTracking[address].getTime() - now.getTime())>(1000 * 3600)){
            const burgers = 1000000;
            await BurgerFaucet.sendBurgers(address, burgers);
            addressTracking[address] = now;
            res.send("Request accepted!");
        }
        else{
            res.send("Request denied, please try again later.");
        }
         
    }
    
  });


server.listen(PORT, () => console.log('Listening on port: ' + PORT));
const BurgerFaucet = require('../burgerFaucet');

/**
 * How to use:
 * 
 * node burgerFaucetClient.js HOST PORT RECEIVER_ADDRESS AMOUNT
 * node burgerFaucetClient.js http://localhost 80 RECEIVER_ADDRESS AMOUNT
 */

const address = process.argv[4] || 'a22eda418a57fda26c5c4e8fb39aec650b355b6d';
const amount = process.argv[5] || 10000;

BurgerFaucet.sendBurgers(address, amount);
console.log('Burgers Sent!');

// BurgerWallet {
//     key: <Key priv: aea18883307cab5018cc4cd9935e85b2b6408c14bb86012f0342c73c71be94f0 pub: <EC Point x: c769d3e60228f9bde7c56d2761721851ba9c8862162841935136dbc645c1c5fd y: b38be1247f272b78af53f3650346411ede3ff648e9c02955337bb481108faf84> >,
//     publicKey: 'c769d3e60228f9bde7c56d2761721851ba9c8862162841935136dbc645c1c5fd0',
//     address: 'a22eda418a57fda26c5c4e8fb39aec650b355b6d',
//     privateKey: 'aea18883307cab5018cc4cd9935e85b2b6408c14bb86012f0342c73c71be94f0' }
  

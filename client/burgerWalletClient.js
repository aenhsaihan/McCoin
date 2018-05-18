const BurgerWallet = require('../burgerWallet');
const readline = require('readline-sync');
let burgerWallet;

const transaction = {
    "from": "c3293572dbe6ebc60de4a20ed0e21446cae66b17",
    "to": "f51362b7351ef62253a227a77751ad9b2302f911",
    "value": 250123,
    "fee": 10,
    "data": "KIM",
}

var privateKey = readline.question("Enter private key [leave blank to generate new wallet]:");

burgerWallet = privateKey?new BurgerWallet(privateKey):new BurgerWallet();
console.log(burgerWallet);

let keys =Object.keys( transaction );

console.log("\n====================Enter transaction details=====================\n");

for(let i = 0; i < keys.length; i++){
    var input = readline.question(keys[i].toString()+": ");
    transaction[keys[i].toString()] = input;
    
}

transaction.dateCreated = new Date().toISOString();
transaction.senderPubKey = burgerWallet.publicKey;

console.log(transaction);
  
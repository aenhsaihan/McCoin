const BurgerWallet = require('../burgerWallet');
const BurgerTransaction = require('../burgerTransaction');
const readline = require('readline-sync');
let burgerWallet;

const rawTransaction = {
    "to": "",
    "value": 0,
    "fee": 0,
    "data": "",
}

var privateKey = readline.question("Enter private key [leave blank to generate new wallet]:");

burgerWallet = privateKey ? new BurgerWallet(privateKey) : new BurgerWallet();
console.log(burgerWallet);

let keys = Object.keys(rawTransaction);

console.log("\n====================Enter transaction details=====================\n");

for (let i = 0; i < keys.length; i++) {
    var input = readline.question(keys[i].toString() + ": ");
    rawTransaction[keys[i].toString()] = input;

}

rawTransaction.dateCreated = new Date().toISOString();
rawTransaction.senderPubKey = burgerWallet.publicKey;
rawTransaction.from = burgerWallet.address;

async function main() {
    const transaction = new BurgerTransaction(rawTransaction.from, rawTransaction.to, rawTransaction.value, rawTransaction.fee, rawTransaction.dateCreated, rawTransaction.data, rawTransaction.senderPubKey);
    const response = await burgerWallet.send(transaction);
    console.log(response);
};

main();
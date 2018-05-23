const BurgerWallet = require('../burgerWallet');
const BurgerTransaction = require('../burgerTransaction');
const BurgerFaucet = require('../burgerFaucet');

async function run() {
    const burgerWallet = BurgerFaucet.wallet;

    for (let iteration = 0; iteration < 5000; iteration++) {
        const receiver = new BurgerWallet();
        const rawTransaction = {
            "to": receiver.address,
            "value": 100,
            "fee": 1,
            "data": "",
        }
        rawTransaction.dateCreated = new Date().toISOString();
        rawTransaction.senderPubKey = burgerWallet.publicKey;
        rawTransaction.from = burgerWallet.address;

        const transaction = new BurgerTransaction(rawTransaction.from, rawTransaction.to, rawTransaction.value, rawTransaction.fee, rawTransaction.dateCreated, rawTransaction.data, rawTransaction.senderPubKey);
        const tx = await burgerWallet.send(transaction);
        console.log(iteration, new Date(), tx, '=>', receiver.address);
        console.log('=======================');
    }
}

run();
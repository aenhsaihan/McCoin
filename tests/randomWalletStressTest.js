const BurgerWallet = require('../burgerWallet');
const BurgerTransaction = require('../burgerTransaction');

async function run() {
    const burgerWallet = new BurgerWallet('b590898d253e4e697d151ff7cca833b7d312daa9');
    console.log(burgerWallet);

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
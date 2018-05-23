const BurgerWallet = require('./burgerWallet');
const BurgerTransaction = require('./burgerTransaction');

class BurgerFaucet {

    constructor() {
        this.wallet = new BurgerWallet('831da5badbeacc2311f0bc301b19dea1f29ff67556345bcfafee9651f835809c');
    }

    async sendBurgers(recipient, amount) {
        const burgerTransaction = new BurgerTransaction(
            this.wallet.address,
            recipient,
            amount,
            100,
            new Date(),
            "Generous burgers fresh from the oven",
            this.wallet.publicKey
        );
        const response = await this.wallet.send(burgerTransaction);
        return response;
    }

    createFaucetTransaction() {
        return new BurgerTransaction(
            '0x000000000000000000000000000000000000000',
            this.wallet.address,
            '100000000000000000000',
            '1000',
            new Date(),
            'The first burgers',
            '0x000000000000000000000000000000000000000'
        );
    }
}

const burgerFaucet = new BurgerFaucet();
const burgerFaucetInstance = Object.freeze(burgerFaucet); // Singleton pattern

module.exports = burgerFaucetInstance;
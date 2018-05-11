const express = require('express')
const BurgerBlockchain = require('./burgerBlockchain')
const BurgerNode = require('./burgerNode')
const app = express()

const burgerBlockchain = new BurgerBlockchain()
const burgerNode = new BurgerNode(burgerBlockchain)

const initializeServer = () => {
    app.listen(process.env.PORT || 3001)
}

app.get('/', (request, response) => {
    response.send('SANITY CHECKS')
})

app.get('/blocks', (request, response) => {
    response.json(burgerNode.getBlocks())
})

initializeServer()
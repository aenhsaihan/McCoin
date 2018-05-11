const express = require('express')
const app = express()

const initializeServer = () => {
    app.listen(process.env.PORT || 3001)
}

app.get('/', (request, response) => {
    response.send('SANITY CHECKS')
})

initializeServer()
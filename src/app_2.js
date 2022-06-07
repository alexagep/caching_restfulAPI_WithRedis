const express = require('express')
const responseTime = require('response-time')
const redis = require('redis')
const axios = require('axios')

const runApp = async () => {

    const app = express()

    app.use(responseTime())

    const MOCK_API = "https://jsonplaceholder.typicode.com/users/";

    const client = redis.createClient()
    client.on('error', (err) => console.log('Redis Client Error', err));
    await client.connect();
    console.log('Redis connected!')

    app.get('/cacheUser/:email', async (req, res) => {
        try {
            //email : Sincere@april.biz
            const email = req.params.email
            const cacheUser = await client.get(email)
            if (cacheUser) {
                return res.json(JSON.parse(cacheUser))
            }
            
            const response = await axios.get(`${MOCK_API}?email=${email}`);

            const user = response.data;
            client.SETEX(email, 600, JSON.stringify(user));
            return res.status(200).json(response.data)

        } catch (err) {
            return res.status(err.response.status)
                .json({ message: err.message })
        }
    })

    app.listen(process.env.PORT || 4000, () => {
        console.log("Node server started")
    })
}
runApp()
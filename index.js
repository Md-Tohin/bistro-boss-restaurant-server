const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

//  middleware
app.use(cors());
app.use(express.json());

// api

app.get('/', (req, res) => {
    res.send("Module 64 Server");
});

app.listen(port, () => {
    console.log(`Module 64 server is running on port ${port}`);
});

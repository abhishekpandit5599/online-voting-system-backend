const express = require("express");
require("./db");
const cors = require("cors");

const PORT = process.env.PORT || 5000;
const app = express();


app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Use User Routes
app.use("/api/v1",require("./routes/user")); 

// Use Admin Routes
app.use("/api/v1",require("./routes/admin")); 

app.listen(PORT,()=>{
    console.log(`Start Server on ${PORT}`);
})

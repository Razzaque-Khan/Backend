// reauire('dotenv').config({path: './env'});
// import dotenv from 'dotenv';


// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectDB from "./db/index.js";




connectDB();






/*
//* First approach
import express from 'express'
const app = express()
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (error)=> {
            console.log('ERROR: ', error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`Example app listening on http://192.168.0.10:${process.env.PORT}`)
        })
    } catch (error) {
        console.log("ERROR: ", error);
        throw error;
    }
})()
*/
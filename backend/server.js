import express  from "express";
import cors from 'cors';
import morgan from "morgan";
import connect from "./database/conn.js";
import router from "./router/route.js";


const app = express();

// middlewares 
 

app.use(express.json());
app.use(cors());
app.use(morgan('tiny'));
app.disable('x-powered-by');
const port = 8000;

//http get request 

app.get('/',(req,res)=>{
    res.status(201).json("Home get resquest");
});

//api routes 

app.use('/api',router)


//start developement server only when we have valid connection server
connect().then(( )=>{
    try {
        app.listen(port,()=>{
            console.log(`server is connected to http://localhost:${port}`);
        })
    } catch (error) {
        console.log('cannot connect to the server')
    }
}).catch(error =>{
    console.log('Invalid database connection')
})


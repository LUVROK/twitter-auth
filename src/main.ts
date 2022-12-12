import express from 'express';
import cors from 'cors';
import { getTwitterUserData } from './controllers/twitterController'

const app = express();
const port = 5000;
app.use(cors());

app.listen(port);
app.post('/twitter', getTwitterUserData)
console.log('App started')
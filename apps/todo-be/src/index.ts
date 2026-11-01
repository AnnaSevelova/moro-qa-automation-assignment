import express from 'express'

import bodyParser from 'body-parser';

import expressJSDocSwagger from 'express-jsdoc-swagger';
import swaggerSpec from './swagger.ts';

import routes from './routes.ts';

const app = express();
const port = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use((_, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE');
    next();
});

expressJSDocSwagger(app)(swaggerSpec)

routes(app);

app.listen(port);

console.log(`Todo app REST API server started on: ${port}`);

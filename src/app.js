require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV, PORT, API_TOKEN } = require('./config');
const { v4: uuid } = require('uuid');

const app = express();

const morganOption = NODE_ENV === 'production' ? 'tiny' : 'common';

const user = [];

const auth = (req, res, next) => {
  const apiToken = API_TOKEN;

  const authToken = req.get('Authorization');
  console.log(apiToken, authToken);
  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }
  next();
};

// Middlewares
app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(express.json());

//Routes
app.get('/address', (req, res) => {
  res.status(201).json(user);
});

app.post('/address', auth, (req, res) => {
  console.log('req.body = ', req.body);
  const {
    firstName,
    lastName,
    address1,
    address2,
    city,
    state,
    zip,
  } = req.body;

  if (!firstName) {
    return res.status(400).send('FirstName is required');
  }
  if (!lastName) {
    return res.status(400).send('lastName is required');
  }
  if (!address1) {
    return res.status(400).send('address1 is required');
  }
  if (!city) {
    return res.status(400).send('city is required');
  }
  if (!state || state.length !== 2) {
    return res.status(400).send('state is required and must ');
  }

  if (!zip || zip.length !== 5) {
    return res.status(400).send('Zip must be five digit number.');
  }

  //Build user info
  const id = uuid();
  const newUser = {
    firstName,
    lastName,
    address1,
    address2,
    city,
    state,
    zip,
    id,
  };

  //Save user in db
  user.push(newUser);

  res
    .status(201)
    .location(`http://localhost:${PORT}/address/:${id}`)
    .json(newUser);
});

app.delete('/address/:Id', auth, (req, res) =>{
  const { Id } = req.params;
  console.log(Id);

  const index = user.findIndex(e=>e.id===Id);

  if(index=== -1){
    return res.status(404).send('User not found');
  }

  user.splice(index,1);

  res.send('deleted');
});

//Error Handler Middleware
app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;

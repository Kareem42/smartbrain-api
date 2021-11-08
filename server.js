/**
 * Base line for creating an API server
 * npm init - to create package.json
 * npm install nodemon 
 * npm install body-parser
 * Make sure to all the start to use npm start
 *   "scripts": {
    "start": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
 * npm start
 */

const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex'); 
const { response } = require('express');

const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'test',
        database: 'smart-brain'
    }
});

const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());

// creating users for our database

/* Changing the send request to database.users will allow you get the registered
added to the database, so that their information will be stored from here on out.
However, every time the server is restarted, the new registered user will not show in the 
database because the server isn't set up to memorize the new users.
*/

app.post('/signin', (req,res) => {
    db.select('email','hash').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
       const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
       if (isValid){
          return db.select('*').from('users')
           .where('email', '=', req.body.email)
           .then(user => {
               res.json(user[0])
           })
           .catch(err => res.status(400).json('unable to get user'))
       } else {
           res.status(400).json('wrong credentials')
       }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res) => {
    const {email, name, password} = req.body;
    var hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
    .into('login')
    .returning('email')
    .then(loginEmail => {
        return trx('users')
            .returning('*')
            .insert({
                email: loginEmail[0],
                name: name,
                joined: new Date()
            })
            .then(users => {
                res.json(users[0]);
            })
          })
          .then(trx.commit)
          .catch(trx.rollback)
        })
    .catch(err => res.status(400).json('Unable to register'))
})

/* This forEach loop will allow the developer to loop through the user profiles that is stored in the database
by the user's id number that is giving to them.
 */
app.get('/profile/:id', (req, res) => {
    const {id} = req.params;
    let found = false;
    db.select('*').from('users').where({id})
        .then(user => {
            if (user.length) {
                res.json(user[0])
            } else {
                res.status(400).json('Not Found')
            }
        })
    .catch(err => res.status(400).json('error getting user'))
})

app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0]);
    })
    .catch(err => res.status(400).json('unable to find entries'))
 })


app.listen(3000, () => {
    console.log('app is running on port 3000');
})
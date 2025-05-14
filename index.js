const express = require('express')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const { UserModel, TodoModel } = require('./db')
const app = express()
JWT_SECRET = "yash2000deep"

mongoose.connect('mongodb+srv://yashdeep:yashdeep2000@cluster0.vlrglmq.mongodb.net/todo-yashdeep')

app.use(express.json())

app.post('/signup', async function (req, res) {
    const email = req.body.email
    const password = req.body.password
    const name = req.body.name

    let user_cred = await UserModel.create({
        email: email,
        password: password,
        name: name
    })
    res.json({
        message: "Logged in!"
    })
})

app.post('/signin', async function (req, res) {
    const email = req.body.email;
    const password = req.body.password;

    let user = await UserModel.findOne({
        email: email,
        password: password
    })

    if (user) {
        const token = jwt.sign({
            id: user._id.toString()
        }, JWT_SECRET)
        res.json({
            token
        })
    } else {
        res.status(403).json({
            message: "Incorrect Credentials"
        })
    }
})

async function auth(req, res, next) {
    let token = req.headers.token;

    if (token) {
        let ObjId = jwt.verify(token, JWT_SECRET)
        if (ObjId.id) {
            let user = await UserModel.findById(ObjId.id)
            req.user = user
            next();
        }
    }
}

app.post('/todo', auth, async function (req, res) {

    let userId = req.user._id;
    let title = req.body.title;
    let done = req.body.done;

    await TodoModel.create({
        title,
        done,
        userId
    })

    res.json({
        title,
        done,
        userId,
        message: "Data filled in database."
    })
})

app.get('/todos', auth, async function (req, res) {
    let userId = req.user._id;
    let todos = await TodoModel.find({
        userId
    });
    res.json({
        todos
    })
})

app.listen(3000)
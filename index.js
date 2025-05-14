const express = require('express')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { UserModel, TodoModel } = require('./db')
const app = express()
JWT_SECRET = "yash2000deep"

mongoose.connect('mongodb+srv://yashdeep:yashdeep2000@cluster0.vlrglmq.mongodb.net/todo-yashdeep')

app.use(express.json())

app.post('/signup', async function (req, res) {
    const email = req.body.email
    const password = req.body.password
    const name = req.body.name
    let errorFound = 0;
    try {
        let hashPassword = await bcrypt.hash(password, 5)
        console.log("HashPassword :", hashPassword)
        await UserModel.create({
            email: email,
            password: hashPassword,
            name: name
        })
    } catch (error) {
        errorFound = 1;
        res.json({
            mesage: "User already exists"
        })
    }
    if (!errorFound)
        res.json({
            message: "Logged in!"
        })
})

app.post('/signin', async function (req, res) {
    const email = req.body.email;
    const password = req.body.password;

    let user = await UserModel.findOne({
        email: email
    })

    if (user) {
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            res.status(403).json({
                message: "Password doesn't match"
            })
        } else {
            const token = jwt.sign({
                id: user._id.toString()
            }, JWT_SECRET)
            res.json({
                token
            })
        }
    } else {
        res.status(403).json({
            message: "User doesn't exist in our DB"
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
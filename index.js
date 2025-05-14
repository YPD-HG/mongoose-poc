require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { z } = require('zod')
const { UserModel, TodoModel } = require('./db')
const app = express()
JWT_SECRET = "yash2000deep"

mongoose.connect('mongodb+srv://yashdeep:yashdeep2000@cluster0.vlrglmq.mongodb.net/todo-yashdeep')

app.use(express.json())

app.post('/signup', async function (req, res) {

    const requiredBody = z.object({
        email: z.string().min(3).max(100).email(),
        name: z.string().min(3).max(100),
        password: z.string().min(3).max(30).regex(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$'), {
            message:
                'Password must be at least 8 characters and contain an uppercase letter, lowercase letter, and number'
        })
    }) // Schema defined using Zod

    // Parse the input data based on the schema
    const parsedDataWithSuccess = requiredBody.safeParse(req.body);

    if (!parsedDataWithSuccess.success) {
        res.json({
            message: "Incorrect Format",
            error: parsedDataWithSuccess.error
        })
        return;
    }
    const email = req.body.email
    const password = req.body.password
    const name = req.body.name
    let errorFound = 0;
    try {
        let hashPassword = await bcrypt.hash(password, 5)
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
            }, process.env.JWT_SECRET)
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

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    await TodoModel.create({
        title,
        done,
        userId,
        time
    })

    res.json({
        title,
        done,
        userId,
        message: "Data filled in database."
    })
})

app.post('/todo_done', auth, async function (req, res) {
    let errorFound = 0;
    try {
        await TodoModel.findById(req.headers.id).updateOne({ $set: { done: true } });
    } catch (e) {
        errorFound = 1;
        console.log(e)
    }
    if (!errorFound)
        res.json({
            message: "Task Completed!"
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
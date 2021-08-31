const { Router } = require('express')
const config = require('config')
const User = require('../models/User.js')
const bcrypt = require('bcryptjs')
const { check, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const authMiddleware = require('../middleware/auth.middleware')
const fileService = require('../services/fileService')
const File = require('../models/File')

const router = new Router();

router.post('/registration',
    [
        check('email', 'uncorrected email').isEmail(),
        check('password', 'password must be longer than 3 and shorter than 12').isLength({ min: 3, max: 12 })
    ],
    async (req, res) => {
        try {

            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: 'Произошла ошибка при регистрации' })
            }


            const { email, password } = req.body;
            const candidate = await User.findOne({ email })
            if (candidate) {
                return res.status(400).json({ message: 'Пользователь с таким email уже существует' })
            }


            const hashedPassword = await bcrypt.hash(password, 7)
            const user = new User({ email, password: hashedPassword })
            await user.save()
            res.json({ message: 'Пользователь был создан' })
            await fileService.createDir(new File({user:user._id, name:''}))

        } catch (error) {
            console.log(error)
            res.send({ message: error.message })
        }
    })

    router.post('/login',
    async (req, res) => {
        try {
            const {email, password} = req.body
            const user = await User.findOne({ email })
            if(!user){
                return res.status(404).json({message: 'Пользователь не найден'})
            }

            const isPassValid = await bcrypt.compare(password, user.password)
            if(!isPassValid){
                return res.status(400).json({message:'Некорректный пароль'})
            }

            const token = jwt.sign({id: user.id},config.get('secretKey'),{expiresIn:'1h'})
            return res.json({
                token,
                user:{
                    id: user.id,
                    email: user.email,
                    diskSpace: user.diskSpace,
                    usedSpace: user.usedSpace,
                    avatar: user.avatar,
                }
            })

        } catch (error) {
            console.log(error)
            res.send({ message: error.message })
        }
    })

    router.get('/auth', authMiddleware,
    async (req, res) => {
        try {
            const user = await User.findOne({_id: req.user.id})
            const token = jwt.sign({id: user.id}, config.get("secretKey"), {expiresIn: "1h"})
            return res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    diskSpace: user.diskSpace,
                    usedSpace: user.usedSpace,
                    avatar: user.avatar
                }
            })
        } catch (e) {
            console.log(e)
            res.send({message: "Server error"})
        }
    })


module.exports = router;
const express = require('express');
const mongoose = require('mongoose');
const config = require('config');
const fileUpload = require('express-fileupload');
const authRouter = require('./routes/auth.routes')
const fileRouter = require('./routes/file.routes')
const cors = require('cors');

const PORT = config.get('serverPort')

const app = express();
app.use(express.static('static'))
app.use(fileUpload({}))
app.use(express.json());
app.use(cors());
app.use('/api/auth', authRouter)
app.use('/api/files', fileRouter)

const start = async() => {
    try {
        await mongoose.connect(config.get('DB_URL'),
        {
            useNewUrlParser:true,
            useUnifiedTopology:true,
            useCreateIndex:true,
        })

        app.listen(PORT,()=>console.log('Server work! Port:' + PORT))
    } catch (error) {
        
    }
}
start()
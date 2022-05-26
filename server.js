const path = require('path');
const http = require('http');
const express = require('express');
const socket = require('socket.io');
const mongoose = require('mongoose');
const User = require('./model/user');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { JsonWebTokenError } = require('jsonwebtoken');

const JWT_SECRET = 'fhgshdgfviouedgf9we65928r74rhffeg.[d;f.gv[e;pgrior]';

const app = express();
const server = http.createServer(app);
const io = socket(server);


mongoose.connect('mongodb://localhost:27017/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex: true
});

console.log(mongoose.connection.readyState);

app.use(express.static(path.join(__dirname,'public')));
app.use(bodyParser.json());

app.post('/login' , async (req, res) => {
    const {username, password: plainTextpassword } = req.body;
    const user = await User.findOne({username}).lean();
    console.log(username,plainTextpassword);
    if(!user){
        return res.json({state: 'error', error: 'Invalid username!!'});
    }

    if(await bcrypt.compare(plainTextpassword, user.password)){
        // username and password matched
        const token = jwt.sign({
            id: user._id,
            email: user.email
        }, 
            JWT_SECRET
        );
        return res.json({state: 'ok', data: token});
    }

    return res.json({state: 'error', error: 'Invalid password!!'});
})

app.post('/register', async (req, res) =>{
    //console.log(req.body);
    const {username, password: plainTextpassword } = req.body;
    if(plainTextpassword.length <8)
        return res.json({status: 'error', error: 'Password should be atleast 8 characters'});
    const password = await bcrypt.hash(plainTextpassword ,  10 );

    try{
        const response = await User.create({
            username, password
        });
        console.log('Usr created successfully ', response);
    }catch(error){
        //  console.log(JSON.stringify(error));
        if(error.code === 11000)
            return res.json({status: 'error', error: 'Username already in use.'});
        else
            throw error;
    }

    res.json({ status: 'ok'});
});

// change password
app.post('/change-password', async (req, res) => {
    const {password, newPassword, token} = req.body;
    console.log(req.body);
    
    if(newPassword.length <8)
        return res.json({status: 'error', error: 'Password should be atleast 8 characters'});
    
    const hashed = await bcrypt.hash(newPassword ,  10 );

    try{
        const user = jwt.verify(token, JWT_SECRET);
        console.log(user);
        const _id = user.id; 
        const u = await User.findOne({_id}).lean();
        if(await bcrypt.compare(password, u.password)){
            // username and password matched

            await User.updateOne({_id}, { $set: { password: hashed}});
            return res.json({state: 'ok'});
        }else{
            return res.json({ state: 'error' , error: 'Wrong Password!!'})
        }

    } catch(error){
        return res.json({state: 'error' , error: 'Oops.. \nSomething went wrong'});
    }
});

app.post('/chat', (req,res) => {
    const {token} = req.body;
    console.log(token);
    try{
        const user = jwt.verify(token,JWT_SECRET);
        return res.json({state: 'ok' , username: user.username});
    } catch(error){
        console.log(error);
        return res.json({state: 'error' , error: 'Oops.. \nSomething went wrong'});
    }
});

io.on('connection', socket=>{
    console.log("new WS connected....");
    
    //listen for chat
    socket.on('chatMsg', ({username,msg}) => {
        console.log(username,msg);
        io.emit('message', {username,msg})
        
    })
    socket.on('disconnect', () => {
        
        io.emit('message', {username: 'Someone', msg: `  just left this chat.`});
    })
});
const PORT  =  process.env.PORT || 3000;
server.listen(PORT, ()=> console.log(`Server started at ${PORT} `));

/* eslint-disable no-unused-vars */
const {request, response} = require('express');
const express = require('express');
const app = express();
const csrf = require('tiny-csrf');

const {Todo, User} = require('./models');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
const cookieSession = require('cookie-session');
const LocalStrategy = require('passport-local');
const bcyrpt = require('bcrypt');
const saltRounds = 10;
const flash = require('connect-flash');
app.use(express.urlencoded({extended: false}));
const path = require('path');
app.set('views',path.join(__dirname,'views'));
app.use(flash());
const user = require('./models/user');

app.use(bodyParser.json());
app.use(cookieParser('ssh!!!! some secret string'));
app.use(csrf('this_should_be_32_character_long', ['POST', 'PUT', 'DELETE']));

app.use(cookieSession({
  secret: 'few things are private',
  cookie:{
    maxAge: 24 * 60 * 60 * 1000
  }
}))

app.use(passport.initialize());
app.use(passport.session());
app.use((request, response, next)=>{
  response.locals.messages = request.flash();
  next();
});

passport.use(new LocalStrategy({
  usernameField: 'email',
  password: 'password',
},(username, password, done) => {
  User.findOne({
    where:{
      email:username,
      
    }
  })
  .then(async(user) => {
    const result = await bcyrpt.compare(password, user.password);
    if(result){
      return done(null,user);
    } else{
      return done(null, false, {message: 'Invalid Password'});
    }
  })
  .catch((error) => {
    console.error(error);
    return done(null,false,{
      message: 'Register First'
  })
})
}))


passport.serializeUser((user, done)=>{
  console.log('Serializing user in session',user.id)
  done(null,user.id);
});

passport.deserializeUser((id,done) => {
  User.findByPk(id)
  .then(user => {
    done(null, user)
  })
  .catch(error =>{
    done(error, null)
  })
})


// seting the ejs is the engine
app.set('view engine', 'ejs');

app.get('/', async (request, response) => {
  if(request.user)
  {
    response.redirect('/todos');
  }
  else{
    response.render('index', {
      title: 'To-do List',
      csrfToken: request.csrfToken(),
    });
  }
});

app.get('/todos',connectEnsureLogin.ensureLoggedIn(), async (request, response)=>{
  const loggedInUser = request.user.id;
  const allTodos = await Todo.getTodos(loggedInUser);
  const overdue = await Todo.overdue(loggedInUser);
  const dueToday = await Todo.dueToday(loggedInUser);
  const dueLater = await Todo.dueLater(loggedInUser);
  const completedItems = await Todo.completedItems(loggedInUser);
  if (request.accepts('html')) {
    response.render('todos', {
      allTodos, overdue, dueToday, dueLater, completedItems,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({ allTodos, overdue, dueToday, dueLater });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/signup', (request, response) => {
  response.render('signup', {
    title: 'Sign Up',
    csrfToken: request.csrfToken(),
  });
});

app.post('/users', async (request, response) => {

  if (!request.body.firstName) {
    request.flash('error', 'First Name can not be blank');
    return response.redirect('/signup');
  }
  if (!request.body.email) {
    request.flash('error', 'Email cannot be blank');
    return response.redirect('/signup');
  }
  if(!request.body.password){
    request.flash('error', 'Please add password');
    return response.redirect('/signup');
  }

  const encryptedPassword =await bcyrpt.hash(request.body.password, saltRounds);
  console.log(encryptedPassword);

  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: encryptedPassword,
    });
    request.login(user, (err)=> {
      if(err){
        console.log(err);
        response.redirect('/')
      }
      response.redirect('/todos');
    })
    
  }
  catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }

});

app.get('/login',(request,response)=>{
  response.render('login',{
    title:'Login',
    csrfToken: request.csrfToken(),
  });
});

app.post('/cookieSession',passport.authenticate('local',{
  failureRedirect: '/login',
  failureFlash: true,
}),(request,response)=>{
  console.log(request.user);
  response.redirect('/todos');
})

app.get('/signout',(request,response, next) => {
  request.logOut((err)=>{
    if(err)
    {
      return next(err);
    }
    response.redirect('/');
  })
})

app.post('/todos', connectEnsureLogin.ensureLoggedIn(),async (request, response)=>{
  if (!request.body.title) {
    request.flash('error', 'Please add title');
    response.redirect('/todos');
  }
  if (!request.body.dueDate) {
    request.flash('error', 'Please add date');
    response.redirect('/todos');
  }

  try {
    
    console.log('entering in try block');
    const todo =await Todo.addTodo({
      title: request.body.title, 
      dueDate: request.body.dueDate,
      userId: request.user.id,
    });
    return response.redirect('/todos');
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});  

app.put('/todos/:id', async (request, response) => {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const upTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(upTodo);
  } catch (error) {
    return response.status(422).json(error);
  }
});

app.delete('/todos/:id',connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  console.log('We have to delete a Todo with ID: ', request.params.id);

  const deleteFlag = await Todo.destroy({ where: { id: request.params.id, userId:request.user.id,}});
  if(deleteFlag ===0)
  {
    return response.send(false);
  }
  else{
    response.send(true);
  }
});

module.exports = app;
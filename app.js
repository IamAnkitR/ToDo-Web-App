/* eslint-disable no-unused-vars */
const { request, response } = require('express');
const express = require('express');
const app = express();
const csrf = require('tiny-csrf');

const { Todo, User } = require('./models');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
const LocalStrategy = require('passport-local');
const bcyrpt = require('bcrypt');
const saltRounds = 10;

app.use(express.urlencoded({ extended: false }));
const path = require('path');
const user = require('./models/user');

app.use(bodyParser.json());
app.use(cookieParser('ssh!!!! some secret string'));
app.use(csrf('this_should_be_32_character_long', ['POST', 'PUT', 'DELETE']));

app.use(session({
  secret:"few things are private",
  cookie:{
    maxAge: 24 * 60 * 60 * 1000
  }
}))

app.use(passport.initialize());
app.use(passport.session());

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
      return done("Invalid Password");
    }
    return done(null,user)
  })
  .catch((error) => {
    return (error)
  })
}))


passport.serializeUser((user, done)=>{
  console.log("Serializing user in session",user.id)
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
  response.render('index', {
    title: 'Todo Application',
    csrfToken: request.csrfToken(),
  });
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

  const encryptedPassword =await bcyrpt.hash(request.body.password, saltRounds);
  console.log(encryptedPassword);

  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: encryptedPassword
    });
    request.login(user, (err)=> {
      if(err){
        console.log(err);
        response.redirect("/")
      }
      response.redirect('/todos');
    })
    
  }
  catch (error) {
    console.log(error);
  }

});

app.get('/login',(request,response)=>{
  response.render('login',{
    title:"Login",
    csrfToken: request.csrfToken(),
  });
});

app.post('/session',passport.authenticate('local',{
  failureRedirect: '/login'
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
  console.log('Todo List');

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
  response.send(deleteFlag ? true : false);
});

module.exports = app;
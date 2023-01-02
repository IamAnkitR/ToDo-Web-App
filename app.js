/* eslint-disable no-unused-vars */
const { request, response } = require('express');
const express = require('express');
const app = express();
const csrf = require('tiny-csrf');

const { Todo, User } = require('./models');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(express.urlencoded({ extended: false }));
const path = require('path');

app.use(bodyParser.json());
app.use(cookieParser('ssh!!!! some secret string'));
app.use(csrf('this_should_be_32_character_long', ['POST', 'PUT', 'DELETE']));


// seting the ejs is the engine
app.set('view engine', 'ejs');

app.get('/', async (request, response) => {
  const allTodos = await Todo.getTodos();
  const overdue = await Todo.overdue();
  const dueToday = await Todo.dueToday();
  const dueLater = await Todo.dueLater();
  const completedItems = await Todo.completedItems();
  if (request.accepts('html')) {
    response.render('index', {
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

  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: request.body.password
    });
    response.redirect('/');
  }
  catch (error) {
    console.log(error);
  }

});


app.get('/todos', (request, response) => {
  console.log('Todo List', request.body);
});
app.post('/todos', async (request, response) => {
  console.log('Todo List');
  try {
    console.log('entering in try block');
    const todo = await Todo.addTodo({
      title: request.body.title, dueDate: request.body.dueDate,
    });
    return response.redirect('/');
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

app.delete('/todos/:id', async function (request, response) {
  console.log('We have to delete a Todo with ID: ', request.params.id);

  const deleteFlag = await Todo.destroy({ where: { id: request.params.id } });
  response.send(deleteFlag ? true : false);
});

module.exports = app;
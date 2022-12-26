/* eslint-disable no-unused-vars */
const {request, response} = require('express');
const express = require('express');
const app = express();

const {Todo} = require('./models');
const bodyParser = require('body-parser');

app.use(express.urlencoded({extended: false}));
const path = require('path');

app.use(bodyParser.json());


// seting the ejs is the engine
app.set('view engine', 'ejs');

app.get('/', async (request, response)=>{
  const allTodos = await Todo.getTodos();
  
  if (request.accepts('html')) {
    response.render('index', {
      allTodos
    });
  } else {
    response.json({allTodos});
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/todos', (request, response)=>{
  console.log('Todo List', request.body);
});
app.post('/todos', async (request, response)=>{
  console.log('Todo List');
  try {
    console.log('entering in try block');
    const todo =await Todo.addTodo({
      title: request.body.title, dueDate: request.body.dueDate,
    });
    return response.redirect('/');
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put('/todos/:id/markAsCompleted', async (request, response)=>{
  console.log('We have updated a todo with id:', request.params.id);
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete('/todos/:id', async function(request, response) {
  console.log('Delete Todo with id: ', request.params.id);
  const deleteFlag = await Todo.destroy({where: {id: request.params.id}});
  response.send(deleteFlag ? true : false);
});

module.exports = app;

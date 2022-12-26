/* eslint-disable no-unused-vars */
const {request, response} = require('express');
const express = require('express');
const app = express();

const {Todo} = require('./models');
const bodyParser = require('body-parser');
const path = require('path');

app.use(bodyParser.json());


// seting the ejs is the engine
app.set('view engine', 'ejs');

app.get('/', async (request, response)=>{
  const allTodos = await Todo.getTodos();
  if (request.accepts('html')) {
    response.render('index', {
      allTodos,
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
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// app.post("/todos",(request,response)=>{
//     console.log("Creating a todo", request.body);
// })

// PUT http://localhost/todos/1/markAsCompleted
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

// app.delete('/todos/:id', (request, response)=>{
//   console.log('Delete a todo by id', request.params.id);
// });

app.delete('/todos/:id', async function(request, response) {
  console.log('We have to delete a Todo with ID: ', request.params.id);
  // FILL IN YOUR CODE HERE

  // First, we have to query our database to delete a Todo by ID.
  // eslint-disable-next-line max-len
  // Then, we have to respond back with true/false based on whether the Todo was deleted or not.
  // response.send(true)
  const deleteFlag = await Todo.destroy({where: {id: request.params.id}});
  response.send(deleteFlag ? true : false);
});

module.exports = app;

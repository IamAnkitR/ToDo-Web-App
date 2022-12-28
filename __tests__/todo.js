const request = require('supertest');
const db = require('../models/index');
const app = require('../app');
const cheerio = require('cheerio');

let server; let agent;

function fetchCsrfToken(res)
{
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe('todo test suits', ()=>{
  beforeAll(async ()=>{
    await db.sequelize.sync({force: true});
    server = app.listen(process.env.PORT || 3000, ()=>{});
    agent = request.agent(server);
  });
  afterAll( async () =>{
    await db.sequelize.close();
    server.close();
  });
  test('Test the functionality of create a new todo item', async () => {
    const getResponse = await agent.get('/');
    const csrfToken = fetchCsrfToken(getResponse);
    const response = await agent.post('/todos').send({
      title: 'copyright year fixed',
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });
  test('Test the update functionality by updating the markAsCompleted', async () => {
    const getResponse = await agent.get('/');
    let csrfToken = fetchCsrfToken(getResponse);
    await agent.post('/todos').send({
      title: 'copyright year has been changed successfully',
      dueDate: new Date().toISOString(),
      completed: false,
      '_csrf': csrfToken,
    });
    const TodosItems = await agent.get('/').set('Accept', 'application/json');
    const TodosItemsParse = JSON.parse(TodosItems.text);
    const calculateTodosTodayITem = TodosItemsParse.dueToday.length;
    const Todo = TodosItemsParse.dueToday[calculateTodosTodayITem - 1];
    const boolStatus = Todo.completed ? false : true;
    anotherRes = await agent.get('/');
    csrfToken = fetchCsrfToken(anotherRes);

    const changeTodo = await agent.put(`/todos/${Todo.id}`)
    .send({_csrf: csrfToken, completed: boolStatus});

    const UpadteTodoItemParse = JSON.parse(changeTodo.text);
    expect(UpadteTodoItemParse.completed).toBe(true);
  });
  test('Test the delete functionality', async () => {
    const getResponse = await agent.get('/');
    let csrfToken = fetchCsrfToken(getResponse);
    await agent.post('/todos').send({
      title: 'Delete functionality checking',
      dueDate: new Date().toISOString(),
      completed: false,
      '_csrf': csrfToken,
    });
    const TodosItems = await agent.get('/').set('Accept', 'application/json');
    const TodosItemsParse = JSON.parse(TodosItems.text);
    const calculateTodosTodayITem = TodosItemsParse.dueToday.length;
    const Todo = TodosItemsParse.dueToday[calculateTodosTodayITem - 1];
    const boolStatus = Todo.completed ? false : true;
    anotherRes = await agent.get('/');
    csrfToken = fetchCsrfToken(anotherRes);

    const changeTodo = await agent.delete(`/todos/${Todo.id}`)
    .send({_csrf: csrfToken, completed: boolStatus});

    const boolResponse = Boolean(changeTodo.text);
    expect(boolResponse).toBe(true);
  });
});
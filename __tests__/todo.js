const request = require('supertest');
const db = require('../models/index');
const app = require('../app');
const cheerio = require('cheerio');
let server;
let agent;

function fetchCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = fetchCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe('todo tests', () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(process.env.PORT || 3000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });
  test('Checking Sign-Up functionality', async () => {
    let res = await agent.get("/signup");
    const csrfToken = fetchCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "First",
      lastName: "Last",
      email: "first@last.com",
      password: "123",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test('Test for another user sign-up feature', async () => {
    let res = await agent.get("/signup");
    const csrfToken = fetchCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "second",
      lastName: "user",
      email: "second@gmail.com",
      password: "1234",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test('Checking Sign-Out functionality', async () => {
    let res = await agent.get("/todos");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/todos");
    expect(res.statusCode).toBe(302);
  });
  
  test('Create new Todo', async () => {
    const agent = request.agent(server);
    await login(agent, "first@last.com", "123");
    const getResponse = await agent.get("/todos");
    const csrfToken = fetchCsrfToken(getResponse);
    const response = await agent.post('/todos').send({
      title: 'copyright year fixed',
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test('Mark as completed', async () => {
    const agent = request.agent(server);
    await login(agent, "first@last.com", "123");
    const getResponse = await agent.get("/todos");
    let csrfToken = fetchCsrfToken(getResponse);
    await agent.post('/todos').send({
      title: 'copyright year has been changed successfully',
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const TodosItems = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const TodosItemsParse = JSON.parse(TodosItems.text);
    const calculateTodosTodayItem = TodosItemsParse.dueToday.length;
    const Todo = TodosItemsParse.dueToday[calculateTodosTodayItem - 1];
    const boolStatus = Todo.completed ? false : true;
    const anotherRes = await agent.get('/todos');
    csrfToken = fetchCsrfToken(anotherRes);

    const changeTodo = await agent
      .put(`/todos/${Todo.id}`)
      .send({ _csrf: csrfToken, completed: boolStatus });

    const UpadteTodoItemParse = JSON.parse(changeTodo.text);
    expect(UpadteTodoItemParse.completed).toBe(true);
  });
  test('Delete functionality', async () => {
    const agent = request.agent(server);
    await login(agent, "first@last.com", "123");
    const getResponse = await agent.get("/todos");
    let csrfToken = fetchCsrfToken(getResponse);
    await agent.post('/todos').send({
      title: 'Delete todo',
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const TodosItems = await agent
    .get("/todos")
    .set("Accept", "application/json");
    const TodosItemsParse = JSON.parse(TodosItems.text);
    const calculateTodosTodayItem = TodosItemsParse.dueToday.length;
    const Todo = TodosItemsParse.dueToday[calculateTodosTodayItem - 1];
    const boolStatus = Todo.completed ? false : true;
    const anotherRes = await agent.get('/');
    csrfToken = fetchCsrfToken(anotherRes);

    const changeTodo = await agent
      .delete(`/todos/${Todo.id}`)
      .send({ _csrf: csrfToken, completed: boolStatus });

    const boolResponse = Boolean(changeTodo.text);
    expect(boolResponse).toBe(true);
  });

  test('Mark as incomplete', async () => {
    const agent = request.agent(server);
    await login(agent, "first@last.com", "123");
    const getResponse = await agent.get("/todos");
    let csrfToken = fetchCsrfToken(getResponse);
    await agent.post('/todos').send({
      title: 'update',
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const TodosItems = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const TodosItemsParse = JSON.parse(TodosItems.text);
    const calculateTodosTodayItem = TodosItemsParse.dueToday.length;
    const Todo = TodosItemsParse.dueToday[calculateTodosTodayItem - 1];
    const boolStatus = !Todo.completed;
    let anotherRes = await agent.get('/todos');
    csrfToken = fetchCsrfToken(anotherRes);

    const changeTodo = await agent
      .put(`/todos/${Todo.id}`)
      .send({ _csrf: csrfToken, completed: boolStatus });

    const UpadteTodoItemParse = JSON.parse(changeTodo.text);
    expect(UpadteTodoItemParse.completed).toBe(true);

    anotherRes = await agent.get('/todos');
    csrfToken = fetchCsrfToken(anotherRes);

    const changeTodo2 = await agent
      .put(`/todos/${Todo.id}`)
      .send({ _csrf: csrfToken, completed: !boolStatus });

    const UpadteTodoItemParse2 = JSON.parse(changeTodo2.text);
    expect(UpadteTodoItemParse2.completed).toBe(false);
  });
  test("A user should be able to see and manage only their own to-dos and nobody else's", async () => {
    const firstAgent = request.agent(server);
    await login(firstAgent, "first@last.com", "123");
    let res = await firstAgent.get("/todos");
    let csrfToken = fetchCsrfToken(res);
    await firstAgent.post("/todos").send({
      title: "first user todo",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await firstAgent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const firstUserLatestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    const secondAgent = request.agent(server);
    await login(secondAgent, "second@gmail.com", "1234");

    res = await secondAgent.get("/todos");
    csrfToken = fetchCsrfToken(res);
    const deletedResponse = await secondAgent
      .delete(`/todos/${firstUserLatestTodo.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parsedDeletedResponse = JSON.parse(deletedResponse.text);
    expect(parsedDeletedResponse).toBe(false);
  });
});
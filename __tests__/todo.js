const request = require('supertest');
const db = require('../models/index');
const app = require('../app');

let server; let agent;

describe('todo test suits', ()=>{
  beforeAll(async ()=>{
    await db.sequelize.sync({force: true});
    server = app.listen(3000, ()=>{});
    agent = request.agent(server);
  });
  afterAll( async () =>{
    await db.sequelize.close();
    server.close();
  });
  test('respond with json at /todos', async () =>{
    const response = await agent.post('/todos').send({
      'title': 'Buy Milk',
      'dueDate': new Date().toISOString(),
      'completed': false,
    });
    expect(response.statusCode).toBe(302);
    
  });

  // test('Marks a todo with the given ID as complete', async () => {
  //   const response = await agent.post('/todos').send({
  //     title: 'Buy milk',
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //   });
  //   const parsedResponse = JSON.parse(response.text);
  //   const todoID = parsedResponse.id;

  //   expect(parsedResponse.completed).toBe(false);

  //   const markCompleteResponse = await agent
  //       .put(`/todos/${todoID}/markASCompleted`)
  //       .send();
  //   const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
  //   expect(parsedUpdateResponse.completed).toBe(true);
  // });
});

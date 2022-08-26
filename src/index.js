const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find(user => user.username === username)

  if (!user) {
    return response.status(404).json({ error: 'User does not exist' })
  } 

  request.user = user

  next()
}

function checksExistsUsersTodo(request, response, next) {
  const { user } = request;
  const { id } = request.params
  
  const todo = user.todos.find(todo => todo.id === id)

  if(!todo) {
    return response.status(404).json({ error: 'Todo id not exists'})
  }

  request.todo = todo

  next()
}

app.post('/users', (request, response) => {
  const { name, username } = request.body


  const userAlreadyExists = users.some(user => user.username === username);

  if (userAlreadyExists) {
    return response.status(400).json({ error: 'User already exists' })
  }
  const user = {
    id: uuidv4(), 
    name, 
    username,
    todos: [],
  }

  users.push(user)

  return response.json({ ...user })
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request

  return response.json(user.todos)
}); 

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request
  const { title, deadline } = request.body
  const errors = []

  if (!title) {
    errors.push('the title field is required')
  }

  if (!deadline) {
    errors.push('the deadline field is required')
  }

  if(errors.length) {
    return response.status(422).json({ error: errors })
  }

  const todo = { 
    id: uuidv4(), 
    title,
    done: false, 
    deadline: new Date(deadline), //ANO-MÊS-DIA
    created_at: new Date()
  }

  user.todos.push(todo)

  return response.status(201).json(todo)
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsUsersTodo, (request, response) => {
  const { todo } = request
  const { title, deadline } = request.body
  
  if (title) {
    todo.title = title
  }

  if (deadline) {
    todo.deadline = new Date(deadline)
  }

  return response.json(todo)
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsUsersTodo, (request, response) => {
  const { todo } = request

  todo.done = true

  return response.status(201).json(todo)
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsUsersTodo, (request, response) => {
  const { user, todo } = request
  
  const todoIndex = user.todos.findIndex(item => item.id === todo.id)
  user.todos.splice(todoIndex, 1);

  // user.todos = user.todos.filter(userTodo => userTodo.id !== todo.id)

  return response.status(204).send()
});

module.exports = app;
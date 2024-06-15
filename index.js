const express = require('express')
const app = express()

let items = []

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

const errorHandler = (error, request, response, next) => {
  console.log(error);
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({ 
      error: 'syntax error' 
    })
  }

  next(error)
}

app.use(express.json())
app.use(requestLogger)

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/todos', (request, response) => {
  response.json(items)
})

const generateId = () => {
  return items.length > 0 ? Math.max(...items.map(n => n.id)) + 1 : 1
}

app.get('/api/todos/:id', (request, response) => {
  const id = Number(request.params.id)
  const item = items.find(item => item.id === id)
  if (!item) {
    response.status(404).end()
  } else {
    response.json(item)
  }
})

app.post('/api/todos', (request, response) => {
  const body = request.body

  if (body.content === undefined || !body.content) {
    return response.status(400).json({ 
      error: 'missing content' 
    })
  }

  const item = {
    content: body.content,
    completed: false,
    id: generateId(),
  }

  items = items.concat(item)

  response.json(item)
})

app.delete('/api/todos/:id', (request, response) => {
  const id = Number(request.params.id)
  items = items.filter(item => item.id !== id)

  response.status(204).end()
})

app.put('/api/todos/:id', (request, response, next) => {
  const id = Number(request.params.id)
  const body = request.body
  
  if (body.completed === undefined) {
    return response.status(400).json({ 
      error: 'missing completed field' 
    })
  }

  const item = items.find( item => item.id === id )

  if (!item) {
    response.status(404).end()
  } else {
    const changedItem = { ...item, completed: Boolean(body.completed) || false }
    items = items.map( item => item.id !== id ? item : changedItem )
    response.json(changedItem)
  }
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
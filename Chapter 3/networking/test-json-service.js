const server = require('net').createServer(connection => {
  console.log('Subscriber Connected')

  // Two messages chunks that together make a whole message.
  const firstChunk = '{"type": "changed", "timesta'
  const secondChunk = 'mp": 1525549135}\n'

  // Send the first chunk immediately
  connection.write(firstChunk)

  // After a short delay, send the other chunk
  const timer = setTimeout(() => {
    connection.write(secondChunk)
    connection.end()
  }, 100)

  connection.on('end', () => {
    clearTimeout(timer)
    console.log('Subscriber disconnected.')
  })
})

server.listen(60300, () => {
  console.log('Test server looking for subscribers...')
})

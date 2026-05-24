process.env.CI = 'true'

const { createServer } = await import('vite')

const server = await createServer({
  root: process.cwd(),
  configFile: 'vite.config.js',
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
  },
})

await server.listen()
server.printUrls()

setInterval(() => {}, 2147483647)

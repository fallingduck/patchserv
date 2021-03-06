const fixPath = require('./fixpath')

const path = require('path')
const compression = require('compression')
const serveStatic = require('serve-static')
const authServer = require('./authserver')
const gitServer = require('./gitserver')
const fileServer = require('./fileserver')
const server = require('./server')

const config = require(fixPath('config.json'))

const siteRoot = path.join(fixPath('site'), config.siteRoot)

/* Begin route definitions */

// Handle compression
server.route(
  /.*/,
  compression()
)

// Git server authorization
server.route(
  /^\/site\.git(\/.*)?$/,
  authServer(fixPath('users.json'))
)

// Git server
server.route(
  /^\/site\.git(\/.*)?$/,
  gitServer(fixPath('site'))
)

// Static site server
server.route(
  /.*/,
  serveStatic(siteRoot, {
    dotfiles: 'ignore'
  })
)

// Handle 404
server.route(
  /.*/,
  fileServer(siteRoot, config.errorPage, 404)
)

// Worst-case 404
server.route(
  /.*/,
  (req, res) => {
    res.statusCode = 404
    res.end('404\n')
  }
)

/* End route definitions */

// Create the server
exports.runServer = (port, host, callback) => {
  const serv = server.makeServer()
  serv.listen(port, host, callback)
}

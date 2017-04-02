var path = require('path')
var spawn = require('child_process').spawn
var backend = require('git-http-backend')
var encode = require('git-side-band-message')
var zlib = require('zlib')
var logger = require('./logger')

module.exports = function(basedir, pushHook) {
  return function(req, res) {
    var repo = req.url.split('/')[1]
    var dir = path.join(basedir, repo)
    var reqStream = req.headers['content-encoding'] == 'gzip' ? req.pipe(zlib.createGunzip()) : req

    reqStream.pipe(backend(req.url, function (err, service) {
        if (err) {
          return res.end(err + '\n')
        }

        res.setHeader('content-type', service.type)

        if (service.action == 'pull') {
          logger.logInfo('Git pull')
        } else if (service.action == 'push') {
          logger.logInfo('Git push (head at %s)', service.fields.head)
        }

        var ps = spawn(service.cmd, service.args.concat(dir))
        ps.stdout.pipe(service.createStream()).pipe(ps.stdin)

        if (service.action == 'push') {
          pushHook(function(err, data) {
            if (err) {
              logger.logWarn(err)
              res.write(encode(err))
            } else {
              logger.logInfo(data)
              res.write(encode(data))
            }
          })
        }
    })).pipe(res)
  }
}
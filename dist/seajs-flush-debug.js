/**
 * The Sea.js plugin for collecting HTTP requests and sending all at once
 */
(function(seajs) {

  var Module = seajs.Module
  var load = Module.prototype.load

  var data = seajs.data
  var stack = data.flushStack = []
  var isLoadOnRequest = false


  Module.prototype.load = function() {
    var mod = this

    if (needLoadImmediately(mod)) {
      load.call(mod)
    }
    else {
      stack.push(mod)
    }
  }

  seajs.use = function(ids, callback) {
    Module.use(ids, callback, data.cwd + "_use_" + data.cid())
    return seajs
  }

  seajs.flush = function() {
    var len = stack.length
    if (len === 0) {
      return
    }

    var currentStack = stack.splice(0, len)
    var deps = []

    // Collect dependencies
    for (var i = 0; i < len; i++) {
      deps = deps.concat(currentStack[i].resolve())
    }

    // Remove duplicate and unfetched modules
    deps = getUnfetchedUris(deps)

    // Create an anonymous module for flushing
    var mod = Module.get(
        data.cwd + "_flush_" + data.cid(),
        deps
    )

    mod.load = load

    mod.callback = function() {
      for (var i = 0; i < len; i++) {
        currentStack[i].onload()
      }
      delete mod.callback
    }

    // Load it
    Module.preload(function() {
      mod.load()
    })
  }


  // Add indicator for onRequest method
  seajs.on("request", function(data) {
    var onRequest = data.onRequest

    // Flush to load dependencies at onRequest
    data.onRequest = function() {
      isLoadOnRequest = true
      onRequest()
      isLoadOnRequest = false

      seajs.flush()
    }
  })

  // Flush to load `require.async` when module.factory is executed
  seajs.on("exec", function() {
    seajs.flush()
  })


  // Helpers

  var PRELOAD_RE = /\/_preload_\d+$/

  function needLoadImmediately(mod) {
    return hasEmptyDependencies(mod) ||
        isSavedBeforeRequest(mod) ||
        isPreload(mod)
  }

  function isSavedBeforeRequest(mod) {
    return !isLoadOnRequest && mod.status === Module.STATUS.SAVED
  }

  function hasEmptyDependencies(mod) {
    return mod.dependencies.length === 0
  }

  function isPreload(mod) {
    if (PRELOAD_RE.test(mod.uri)) {
      return true
    }

    for (var uri in mod._waitings) {
      if (isPreload(seajs.cache[uri])) {
        return true
      }
    }

    return false
  }

  function getUnfetchedUris(uris) {
    var ret = []
    var hash = {}
    var uri

    for (var i = 0, len = uris.length; i < len; i++) {
      uri = uris[i]

      // Remove duplicate uris
      if (uri && !hash[uri]) {
        hash[uri] = true

        // Remove existed modules
        if(!seajs.cache[uri]){
          ret.push(uri)
        }
      }
    }

    return ret
  }


  // Register as module
  define("seajs-flush-debug", [], {})

})(seajs);


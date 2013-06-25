/**
 * The Sea.js plugin for collecting HTTP requests and sending all at once
 */
(function(seajs) {

  var Module = seajs.Module
  var load = Module.prototype.load

  var data = seajs.data
  var stack = data.flushStack = []


  Module.prototype.load = function() {
    // DO NOT delay preload modules
    if (/\/_preload_\d+$/.test(this.uri)) {
      load.call(this)
    }
    else {
      stack.push(this)
    }
  }

//  seajs.use = function(ids, callback) {
//    Module.use(ids, callback, data.cwd + "_use_" + data.cid())
//    return seajs
//  }

  seajs.flush = function() {
    var currentStack = stack.splice(0)

    var len = currentStack.length
    if (len === 0) {
      return
    }

    var deps = []

    // Collect dependencies
    for (var i = 0; i < len; i++) {
      deps = deps.concat(currentStack[i].resolve())
    }

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
    }

    // Load it
    //Module.preload(function() {
    mod.load()
    //})
  }

  // Flush to load dependencies
  seajs.on("requested", function() {
    seajs.flush()
  })

  // Flush to load `require.async` when module.factory is executed
  seajs.on("exec", function() {
    seajs.flush()
  })


  // Register as module
  define("seajs-flush-debug", [], {})

})(seajs);


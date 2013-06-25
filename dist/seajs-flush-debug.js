/**
 * The Sea.js plugin for collecting HTTP requests and sending all at once
 */
(function(seajs) {

  var Module = seajs.Module
  var load = Module.prototype.load

  var data = seajs.data
  var cid = 0
  var stack = []


  Module.prototype.load = function() {
    // DO NOT delay preload modules
    if (/\/_preload_\d+$/.test(this.uri)) {
      load.call(this)
    }
    else {
      stack.push(this)
    }
  }

  seajs.flush = function() {
    var currentStack = stack.splice(0)
    var deps = []

    // Collect dependencies
    for (var i = 0, len = currentStack.length; i < len; i++) {
      deps = deps.concat(currentStack[i].resolve())
    }

    // Create an anonymous module for flushing
    var mod = Module.get(
        data.cwd + "_flush_" + cid++,
        deps
    )

    mod.load = load

    mod.callback = function() {
      for (var i = 0, len = currentStack.length; i < len; i++) {
        currentStack[i].onload()
      }
    }

    // Load it
    mod.load()
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


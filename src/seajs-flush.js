/**
 * The Sea.js plugin for collecting HTTP requests and sending all at once
 */
(function(seajs) {

  var Module = seajs.Module
  var _load = Module.prototype._load

  var data = seajs.data
  var cid = 0
  var stack = []


  Module.prototype._load = function() {
    stack.push(this)
  }

  seajs.flush = function() {
    var deps = []

    // Collect dependencies
    for (var i = 0, len = stack.length; i < len; i++) {
      deps = deps.concat(stack[i].dependencies)
    }

    // Create an anonymous module for flushing
    var mod = Module.get(
        uri || data.cwd + "_flush_" + cid++,
        deps
    )

    mod._load = _load

    mod._callback = function() {
      for (var i = 0, len = stack.length; i < len; i++) {
        stack[i]._onload()
      }

      // Empty stack
      stack.length = 0
    }

    // Load it
    mod._load()
  }

  // Flush on loaded
  seajs.on("requested", function() {
    seajs.flush()
  })


  // Register as module
  define("seajs-flush", [], {})

})(seajs);


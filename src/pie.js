var Obj = require('extensions/object');

// # Pie
// The top level namespace of the framework.
var Pie = {

  apps: {},

  pieId: 1,


  // ** pie.guid **
  //
  // Generate a globally unique id.
  guid: function() {
    var r, v;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      r = Math.random()*16|0,
      v = c === 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  },

  // ** pie.ns **
  //
  // If it's not already present, build a path on `base`.
  // By default, `base` is the global `window`.
  // The deepest namespace object is returned so you can immediately use it.
  // ```
  // pie.ns('lib.foo.bar').baz = function(){};
  // //=> generates { lib: { foo: { bar: { baz: function(){} } } } }
  // ```
  ns: function(path, base) {
    base = base || window;
    return Obj.getPath(base, path) || Obj.setPath(base, path, {});
  },

  // ** pie.qs **
  //
  // Alias for `document.querySelector`
  qs: function() {
    return document.querySelector.apply(document, arguments);
  },

  // ** pie.qsa **
  //
  // Alias for `document.querySelectorAll`
  qsa: function() {
    return document.querySelectorAll.apply(document, arguments);
  },

  // ** pie.setUid **
  //
  // Set the `pieId` of `obj` if it isn't already present.
  setUid: function(obj) {
    return obj.pieId = obj.pieId || Pie.unique();
  },

  // ** pie.unique **
  //
  // Provide a unique integer not yet used by pie.
  // This is good for unique local ids.
  unique: function() {
    return String(Pie.pieId++);
  },


  _debugArgs: function(msg) {
    return ["%c[pie] %c" + msg, "color: orange; font-weight: bold;", "color: inherit; font-weight: inherit;"];
  }

};

module.exports = Pie;

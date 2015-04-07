var Arr = require('./../extensions/array');

module.exports = {

  get: function(name) {
    return this.query({name: name});
  },

  has: function(name) {
    return Arr.areAny(this, function(change) {
      return change.name === name;
    });
  },

  hasAny: function() {
    for(var i = 0; i < arguments.length; i++) {
      if(this.has(arguments[i])) return true;
    }
    return false;
  },

  hasAll: function() {
    for(var i = 0; i < arguments.length; i++) {
      if(!this.has(arguments[i])) return false;
    }
    return true;
  },

  query: function(options) {
    return this._query('detectLast', options);
  },

  queryAll: function(options) {
    return this._query('filter', options);
  },

  _query: function(arrayFn, options) {
    var names = Arr.from(options.names || options.name),
    types = Arr.from(options.types || options.type);

    return Arr[arrayFn](this, function(change) {
      return (!names.length || ~names.indexOf(change.name)) &&
             (!types.length || ~types.indexOf(change.type));
    });
  }

};

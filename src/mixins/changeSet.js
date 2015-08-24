pie.mixins.changeSet = {

  get: function(name) {
    return this.query({name: name});
  },

  has: function(name) {
    var glob = pie.string.endsWith(name, '.*') ? name.replace('.*', '') : undefined;
    
    return pie.array.areAny(this, function(change) {
      return glob ? pie.string.startsWith(change.name, glob + '.') : change.name === name;
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
    var names = pie.array.from(options.names || options.name),
    types = pie.array.from(options.types || options.type);

    return pie.array[arrayFn](this, function(change) {
      return (!names.length || ~names.indexOf(change.name)) &&
             (!types.length || ~types.indexOf(change.type));
    });
  }

};

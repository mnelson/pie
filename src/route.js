var Model = require('./model');
var Arr   = require('./extensions/array');
var Obj   = require('./extensions/object');
var Str   = require('./extensions/string');

// # Pie Route
//
// Represents a route used by the router.
// Routes understand if they match string paths, they know how to extract interpolations from a path,
// and know how to generate a path given some data.
// ```
// r = new pie.route('/foo/:id');
//
// r.isDirectMatch('/foo/bar')
// //=> false
// r.isMatch('/foo/bar')
// //=> true
//
// r.interpolations('/foo/bar')
// //=> {id: 'bar'}
//
// r.path({id: 'baz', page: 2})
// //=> '/foo/baz?page=2'
// ```
module.exports = Model.extend('route', {

  init: function(path, options) {
    this._super({
      pathTemplate: Str.normalizeUrl(path)
    }, options);

    this.name = this.options.name || ("route-" + this.pieId);

    this.compute('segments',            'pathTemplate');
    this.compute('pathRegex',           'pathTemplate');
    this.compute('weight',              'segments');
  },

  // **pie.route.segments**
  //
  // The pathTemplate split into segments.
  // Since this is a computed property, we only ever have to do this once.
  segments: function() {
    return this.get('pathTemplate').split('/');
  },

  // **pie.route.pathRegex**
  //
  // A RegExp representing the path.
  // Since this is a computed property, we only ever have to do this once.
  pathRegex: function() {
    var t = this.get('pathTemplate');
    t = t.replace(/(:[^\/]+)/g,'([^\\/]+)');
    t = t.replace(/(\*[^\/]+)/g, '(.+)');
    return new RegExp('^' + t + '$');
  },

  // **pie.route.weight**
  //
  // A weight representing the specificity of the route. It compiles a number as a string
  // based on the type of segment then casts the number as an integer as part of the return statement.
  // Specificity is determined by:
  //   -
  // Since this is a computed property, we only ever have to do this once.
  weight: function() {
    var tmpls = this.get('segments'),
    w = '';

    tmpls.forEach(function(segment){
      if(segment.match(/^:([^\/]+)$/))
        w += '3';
      else if(segment.match(/^\*([^\/]+)$/))
        w += '2';
      else if(segment === '')
        w += '1';
      else
        w += '4';
    });

    return +w;
  },

  // **pie.route.interpolations**
  //
  // Under the assumption that the path is already normalized and we've "matched" it,
  // extract the interpolations from `path`. If `parseValues` is true, the values will
  // be parsed based on `Str.deserialize`'s implementation.
  // ```
  // r = new pie.route('/foo/:id');
  // r.interolations('/foo/bar');
  // //=> {id: 'bar'}
  // ```
  interpolations: function(path, parseValues) {
    var splitPaths = path.split('/'),
    tmpls = this.get('segments'),
    interpolations = {},
    splitPath, tmpl;

    for(var i = 0; i < splitPaths.length; i++){
      tmpl = tmpls[i];
      splitPath = splitPaths[i];
      if(splitPath !== tmpl) {
        if(tmpl.charAt(0) === ':') {
          interpolations[tmpl.substr(1)] = splitPath;
        } else if(tmpl.charAt(0) === '*') {
          interpolations[tmpl.substr(1)] = Arr.get(splitPaths, i, -1).join('/');
          break;
        }
      }
    }

    if(parseValues) interpolations = Str.deserialize(Obj.serialize(interpolations), true);

    return interpolations;
  },

  // **pie.route.isDirectMatch**
  //
  // Is the provided `path` a direct match to our definition?
  isDirectMatch: function(path) {
    return path === this.get('pathTemplate');
  },

  // **pie.route.isMatch**
  //
  // is the provided `path` a match based on our `pathRegex`.
  isMatch: function(path) {
    return this.get('pathRegex').test(path);
  },

  // **pie.route.path**
  //
  // Generate a path based on our template & the provided `data`. If `interpolateOnly` is true,
  // a query string will not be appended, even if there are extra items provided by `data`.
  // ```
  // r = new pie.route('/foo/:id');
  // r.path({id: 'bar'})
  // //=> '/foo/bar'
  // r.path({id: 'baz', page: 2});
  // //=> '/foo/baz?page=2'
  // r.path({id: 'qux', page: 2}, true);
  // //=> '/foo/qux'
  // ```
  path: function(data, interpolateOnly) {
    var usedKeys = [],
    s = this.get('pathTemplate'),
    params,
    unusedData;

    data = data || {};

    s = s.replace(/[:\*]([a-zA-Z0-9_]+)/g, function(match, key){
      usedKeys.push(key);
      if(data[key] === undefined || data[key] === null || data[key].toString().length === 0) {
        throw new Error("[PIE] missing route interpolation: " + match);
      }
      return data[key];
    });

    s = Str.normalizeUrl(s);

    unusedData = Obj.except(data, usedKeys);
    params = Obj.serialize(Obj.compact(unusedData, true));

    if(!interpolateOnly && params.length) {
      s = Str.urlConcat(s, params);
    }

    return s;
  }

});

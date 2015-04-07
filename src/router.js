var Model     = require('./model');
var Cache     = require('./cache');
var Route     = require('./route');
var Arr       = require('./extensions/array');
var Obj       = require('./extensions/object');
var Str       = require('./extensions/string');
var Container = require('./mixins/container');

// # Pie Router
//
// An interface for declaring, processing, and determing a collection of routes.
module.exports = Model.extend('router', {

  // **pie.router.init**
  //
  // Initialize a new router given an `app` and a set of options.
  // Options:
  // * **root** - the root to be prepended to all constructed routes. Defaults to `'/'`.
  init: function(app, options) {
    this._super({
      root: options && options.root || '/'
    }, Obj.merge({
      app: app
    }, options));

    this.cache = new Cache();
    this.compute('rootRegex', 'root');
  },

  // **pie.router.rootRegex**
  //
  // A regex for testing whether a path starts with the declared root
  rootRegex: function() {
    return new RegExp('^' + this.get('root'));
  },

  // **pie.router.changedUrl**
  //
  // Get a url based on the app's current one but with the changes provided.
  // This will even catch interpolated values.
  // ```
  // // Given a route of `/things/page/:page.json`
  // // and the current path == `/things/page/1.json?q=test`
  // app.router.changedUrl({page: 3, q: 'newQuery'});
  // //=> /things/page/3.json?q=newQuery
  // ```
  changedUrl: function(changes) {
    var current = this.app.parsedUrl;
    return this.path(current.get('route.name') || current.get('path'), Obj.merge({}, current.get('data'), changes));
  },

  // **pie.router.findRoute**
  //
  // Find the most relevant route based on `nameOrPath`.
  // Direct matches match first, then the most relevant pattern match comes next.
  findRoute: function(nameOrPath) {
    var route = this.getChild(nameOrPath, false);
    /* if a direct match is present, we return that */
    route = route || this.findDirectMatch(nameOrPath);
    /* otherwise, we look for a pattern match */
    route = route || this.findPatternMatch(nameOrPath);
    return route;
  },

  findDirectMatch: function(nameOrPath) {
    return Arr.detect(this.children, function(r){ return r.isDirectMatch(nameOrPath); });
  },

  findPatternMatch: function(nameOrPath) {
    return Arr.detect(this.children, function(r){ return r.isMatch(nameOrPath); });
  },


  // **pie.router.map**
  //
  // Add routes to this router.
  // Routes objects which contain a "name" key will be added as a name lookup.
  // You can pass a set of defaults which will be extended into each route object.
  // ```
  // router.map({
  //
  //   '/foo/:id' : {subView: 'foo',  name: 'foo'},
  //   '/bars'    : {subView: 'bars', name: 'bars'},
  //
  //   'api.whatever' : '/api/whatever.json'
  // }, {
  //   view: 'sublayout'
  // });
  // ```
  map: function(routes, defaults){
    defaults = defaults || {};

    var path, config, route, existing;

    Obj.forEach(routes, function(k,r) {

      if(Obj.isObject(r)) {
        path = k;
        config = r;
        if(defaults) config = Obj.merge({}, defaults, config);
      } else {
        path = r;
        config = {name: k};
      }

      existing = this.findDirectMatch(path) || (config.name || this.findRoute(config.name));
      this.removeChild(existing);

      route = new Route(path, config);

      this.addChild(route.name, route);
    }.bind(this));

    this.sortRoutes();
    this.cache.clear();
  },

  // **pie.router.onMiss**
  //
  // The config to return when a route is parsed but not recognized.
  onMiss: function(config) {
    this.missedConfig = config;
  },

  // **pie.router.path**
  //
  // Will return the named path. If there is no path with that name it will return itself.
  // You can optionally pass a data hash and it will build the path with query params or
  // with path interpolation.
  // ```
  // router.path("/foo/bar/:id", {id: '44', q: 'search'})
  // //=> "/foo/bar/44?q=search"
  // ```
  path: function(nameOrPath, data, interpolateOnly) {
    var r = this.findRoute(nameOrPath) || new Route(nameOrPath),
    path;

    data = Obj.merge(r.interpolations(nameOrPath), data);
    path = r.path(data, interpolateOnly);

    // apply the root.
    if(!Str.PROTOCOL_TEST.test(path) && !this.get('rootRegex').test(path)) {
      path = this.get('root') + path;
      path = Str.normalizeUrl(path);
    }

    return path;
  },

  // **pie.router.sortRoutes**
  //
  // Sorts the routes to be the most exact to the most generic.
  // * prefers fewer interpolations to more
  // * prefers more segments to less
  // * prefers more characters to less
  sortRoutes: function() {
    var c;

    this.sortChildren(function(a,b) {
      c = b.get('weight') - a.get('weight');
      c = c || b.get('pathTemplate').length - a.get('pathTemplate').length;
      c = c || a.get('pathTemplate').localeCompare(b.get('pathTemplate'));
      return c;
    });
  },

  // **pie.router.parseUrl**
  //
  // Given a `path`, generate an object representing the matching route.
  // The result will  have the following attributes:
  // * **path** - a normalized version of the matching path.
  // * **fullPath** - the normalized path including the query string.
  // * **interpolations** - an object representing the interpolations within the path.
  // * **query** - an object representing the query string.
  // * **data** - an object combining the interpolations and the query
  // * **route** - the matching route object.
  // * ** * ** - all the information passed into the router for the matching route.
  parseUrl: function(path, parseQuery) {
    return this.cache.getOrSet(path, function(){

      var result, pieces, query, match, fullPath, pathWithRoot, interpolations;

      pieces = path.split('?');

      path = pieces.shift();
      path = path.replace(this.get('rootRegex'), '');
      path = Str.normalizeUrl(path);

      query = pieces.join('&') || '';

      match = this.findRoute(path);

      query = Str.deserialize(query, parseQuery);
      fullPath = Arr.compact([path, Obj.serialize(query)], true).join('?');
      pathWithRoot = Str.normalizeUrl(this.get('root') + path);
      interpolations = match && match.interpolations(path, parseQuery);

      result = Obj.merge({
        path: path,
        fullPath: fullPath,
        pathWithRoot: pathWithRoot,
        interpolations: interpolations || {},
        query: query,
        data: Obj.merge({}, interpolations, query),
        route: match
      }, match && match.options || this.missedConfig);

      return result;
    }.bind(this));
  }
}, Container);

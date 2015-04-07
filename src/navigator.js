var Model = require('./model');
var Arr   = require('./extensions/array');
var Dom   = require('./extensions/dom');
var Obj   = require('./extensions/object');
var Str   = require('./extensions/string');

// # Pie Navigator
// The navigator is in charge of observing browser navigation and updating it's data.
// It's also the place to conduct push/replaceState history changes.
// The navigator is simply a model, enabling observation, computed values, etc.
module.exports = Model.extend('navigator', {

  init: function(app) {
    this.app = app;
    this._super({});
  },

  // ** pie.navigator.go **
  //
  // Go to `path`, appending `params`.
  // If `replace` is true replaceState will be used in favor of pushState.
  // If no changes are made, nothing will happen.
  // ```
  // navigator.go('/foo/bar', {page: 2});
  // //=> pushState: '/foo/bar?page=2'
  // ```
  go: function(path, params, replace) {
    var split = path.split('?'), query, url, state;
    path = split[0];
    query = split[1];

    params = Obj.deepMerge(query ? Str.deserialize(query) : {}, params);

    if(this.test('path', path) && this.test('query', params)) {
      return this;
    }

    url = path;

    if(Obj.hasAny(params)) {
      url = Str.urlConcat(url, Obj.serialize(params));
    }

    state = this.stateObject(path, params, replace);
    window.history[replace ? 'replaceState' : 'pushState'](state, document.title, url);
    window.historyObserver();
  },

  // ** pie.navigator.setDataFromLocation **
  //
  // Look at `window.location` and transform it into stuff we care about.
  // Set the data on this navigator object.
  setDataFromLocation: function() {
    var stringQuery = window.location.search.slice(1),
    query = Str.deserialize(stringQuery);

    this.sets({
      url: window.location.href,
      path: window.location.pathname,
      anchor: window.location.hash.slice(1),
      fullPath: Arr.compact([window.location.pathname, stringQuery], true).join('?'),
      query: query
    });
  },

  // ** pie.navigator.start **
  //
  // Setup the navigator and initialize the data.
  start: function() {
    /* we can only have one per browser. Multiple apps should observe pieHistoryChang on the body */
    if(!window.historyObserver) {
      window.historyObserver = function() {
        Dom.trigger(document.body, 'pieHistoryChange');
      };
    }
    /* observe popstate and invoke our single history observer */
    Dom.on(window, 'popstate', function() {
      window.historyObserver();
    });

    /* subscribe this navigator to the global history event */
    Dom.on(document.body, 'pieHistoryChange.nav-' + this.pieId, this.setDataFromLocation.bind(this));

    return this.setDataFromLocation();
  },

  stateObject: function(newPath, newQuery, replace) {
    var state = {
      navigator: {
        path: newPath,
        query: newQuery
      }
    };

    if(replace) {
      Obj.deepMerge(state, window.history.state);
    } else {
      state.navigator.referringPath = this.get('path');
      state.navigator.referringQuery = this.get('query');
    }

    return state;
  }
});

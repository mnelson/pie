pie.navigator = pie.model.extend('navigator', {

  init: function(app) {
    this.app = app;
    this._super({});
  },

  go: function(path, params, replace) {
    var url = path;

    params = params || {};

    if(this.get('path') === path && this.get('query') === params) {
      return this;
    }

    if(Object.keys(params).length) {
      url += '?';
      url += pie.object.serialize(params);
    }

    window.history[replace ? 'replaceState' : 'pushState']({}, document.title, url);

    return this.setDataFromLocation();
  },


  start: function() {
    return this.setDataFromLocation();
  },

  setDataFromLocation: function() {
    var stringQuery = window.location.search.slice(1),
    query = pie.string.deserialize(stringQuery);

    this.sets({
      url: window.location.href,
      path: window.location.pathname,
      fullPath: pie.array.compact([window.location.pathname, stringQuery], true).join('?'),
      query: query
    });

    return this;
  }
});

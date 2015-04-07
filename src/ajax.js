var Obj     = require('extensions/object');
var Base    = require('base');
var Request = require('ajaxRequest');

module.exports = Base.extend('ajax', {

  init: function(app){
    this.app = app;
  },

  defaultAjaxOptions: {
    verb: 'GET',
    accept: 'application/json',
    headers: {}
  },

  _normalizeOptions: function(options) {
    if(Obj.isString(options)) options = {url: options};
    return options;
  },

  // Interface for conducting ajax requests.
  // Returns a pie.ajaxRequest object
  ajax: function(options, skipSend) {
    options = Obj.deepMerge({}, this.defaultAjaxOptions, this._normalizeOptions(options));

    var req = new Request({}, { app: this.app });
    req.build(options, skipSend);

    /* add a default error handler if the user hasn't provided one. */
    if(!req.emitter.hasCallback('error')) {
      req.error(this.app.errorHandler.handleXhrError.bind(this.app.errorHandler));
    }

    return req;
  },


  del: function(options, skipSend) {
    options = Obj.merge({verb: 'DELETE'}, this._normalizeOptions(options));
    return this.ajax(options, skipSend);
  },

  get: function(options, skipSend) {
    options = Obj.merge({verb: 'GET'}, this._normalizeOptions(options));
    return this.ajax(options, skipSend);
  },

  patch: function(options, skipSend) {
    options = Obj.merge({verb: 'PATCH'}, this._normalizeOptions(options));
    return this.ajax(options, skipSend);
  },

  post: function(options, skipSend) {
    options = Obj.merge({verb: 'POST'}, this._normalizeOptions(options));
    return this.ajax(options, skipSend);
  },

  put: function(options, skipSend) {
    options = Obj.merge({verb: 'PUT'}, this._normalizeOptions(options));
    return this.ajax(options, skipSend);
  }

});

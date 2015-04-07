var Model     = require('model');
var Fn        = require('extensions/function');
var PieDate   = require('extensions/date');
var Obj       = require('extensions/object');

module.exports = Model.extend('cache', {

  init: function(data, options) {
    this._super(data, options);
  },

  clear: function() {
    this.reset();
  },

  del: function(path) {
    this.set(path, undefined);
  },

  expire: function(path, ttl) {
    var value = this.get(path);

    if(value === undefined) return false;

    this.set(path, value, {ttl: ttl});
    return true;
  },

  get: function(path) {
    var wrap = this._super(path);
    if(!wrap) return undefined;
    if(wrap.expiresAt && wrap.expiresAt <= this.currentTime()) {
      this.set(path, undefined);
      return undefined;
    }

    return wrap.data;
  },

  getOrSet: function(path, value, options) {
    var result = this.get(path);
    if(result !== undefined) return result;
    value = Fn.valueFrom(value);
    this.set(path, value, options);
    return value;
  },

  set: function(path, value, options) {
    if(value === undefined) {
      this._super(path, undefined, options);
    } else {
      var wrap = this.wrap(value, options);
      this._super(path, wrap, options);
    }
  },

  wrap: function(obj, options) {
    options = options || {};
    // it could come in on a couple different keys.
    var expiresAt = options.expiresAt || options.expiresIn || options.ttl;

    if(expiresAt) {
      // make sure we don't have a date.
      if(expiresAt instanceof Date) expiresAt = expiresAt.getTime();
      // or a string
      if(Obj.isString(expiresAt)) {
        // check for a numeric
        if(/^\d+$/.test(expiresAt)) expiresAt = parseInt(expiresAt, 10);
        // otherwise assume ISO
        else expiresAt = PieDate.timeFromISO(expiresAt).getTime();
      }

      // we're dealing with something smaller than a current milli epoch, assume we're dealing with a ttl.
      if(String(expiresAt).length < 13) expiresAt = this.currentTime() + expiresAt;
    }

    return {
      data: obj,
      expiresAt: expiresAt
    };
  },

  currentTime: function() {
    return PieDate.now();
  }
});

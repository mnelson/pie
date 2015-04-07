var Base = require('base');
var Arr  = require('extensions/array');
var Obj  = require('extensions/object');
// ## Pie Range Options
//
// A small utilitly class which matches range options to comparators.
// ```
// range = new pie.validator.rangeOptions(app, {gte: 3, lt: 8});
// range.matches(3)
// //=> true
// range.matches(10)
// //=> false
// ```
module.exports = Base.extend('rangeOptions', {

  init: function(app, hash) {
    this.i18n = app.i18n;
    this.rangedata = hash || {};
    /* for double casting situations */
    if(Obj.has(this.rangedata, 'rangedata')) this.rangedata = this.rangedata.rangedata;
  },

  get: function(key) {
    return pie.fn.valueFrom(this.rangedata[key]);
  },

  has: function(key) {
    return Obj.has(this.rangedata, key);
  },

  t: function(key, options) {
    return this.i18n.t('app.validations.range_messages.' + key, options);
  },

  matches: function(value) {
    var valid = true;
    valid = valid && (!this.has('gt') || value > this.get('gt'));
    valid = valid && (!this.has('lt') || value < this.get('lt'));
    valid = valid && (!this.has('gte') || value >= this.get('gte'));
    valid = valid && (!this.has('lte') || value <= this.get('lte'));
    valid = valid && (!this.has('eq') || value === this.get('eq'));
    return valid;
  },

  message: function() {
    if(this.has('eq')) {
      return this.t('eq', {count: this.get('eq')});
    } else {
      var s = ['',''];

      if(this.has('gt')) s[0] += this.t('gt', {count: this.get('gt')});
      else if(this.has('gte')) s[0] += this.t('gte', {count: this.get('gte')});

      if(this.has('lt')) s[1] += this.t('lt', {count: this.get('lt')});
      else if(this.has('lte')) s[1] += this.t('lte', {count: this.get('lte')});

      return Arr.toSentence(Arr.compact(s, true), this.i18n).trim();
    }
  }
});

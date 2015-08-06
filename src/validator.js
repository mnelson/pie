// # Pie Validator
// A collection of validators commonly used in web forms.
// ```
// validator = pie.validator.create();
// validator.email("foo@djalfdsaf");
// //=> false
// validator.email("foo@bar.com");
// //=> true
// validator.email("", {allowBlank: true});
// //=> true
// ```
// Messages can be generated based on a validation type and the set of provided options. The messages are formed
// via the associated app's `i18n` object.
// ```
// validator.errorMessage('length', {gte: 4})
// //=> "must be greater than or equal to 4"
// ```
// Default validation messages are configured in i18n.js.
pie.validator = pie.base.extend('validator', {

  init: function(app, options) {
    this.app = app || pie.appInstance;
    this.i18n = app.i18n;
    this.options = pie.object.deepMerge({
      formats: {
        isoDate: /^\d{4}\-\d{2}\-\d{2}$/,
        isoTime: /^\d{4}\-\d{2}\-\d{2}T\d{2}-\d{2}-\d{3}/,
        epochs: /^\d{10}$/,
        epochms: /^\d{13}$/
      }
    }, options);

    this._super();
  },

  // **pie.validator.errorMessage**
  //
  // Generate a validation message based on the given `validationType` and `validationOptions`.
  // Note there is no value given so the message will always be the full set of expectations, not
  // necessarily the parts that failed.
  // ```
  // validator.errorMessage("length", {gte: 4})
  // //=> "must be greater than or equal to 4"
  // ```
  // If validationOptions contains a `message` key, that will be used to produce the message.
  // The `message` key can be a string, i18n attempt path, or a function.
  // If the validationOPtions contains a `messageKey` key, that will be used as an i18n lookup
  // at `app.validations.${messageKey}`.
  errorMessage: function(validationType, validationOptions) {

    if(validationOptions.message) {
      var msg = validationOptions.message;
      if(pie.object.isFunction(msg)) msg = msg(validationType, validationOptions);
      return this.app.i18n.attempt(msg);
    }

    var key = validationOptions.messageKey || validationType,
        base = this.i18n.t('app.validations.' + key),
        rangeOptions = pie.validator.rangeOptions.create(this.app, validationOptions),
        range = rangeOptions.message();

    if(!range && key === 'length') {
      rangeOptions = pie.validator.rangeOptions.create(this.app, {gt: 0});
      range = rangeOptions.message();
    }

    return (base + ' ' + range).trim();
  },


  // **pie.validator.withStandardChecks**
  //
  // A series of common checks to make based on options passed to validators.
  // It handles `allowBlank`, `if`, and `unless` checks. Assuming all of these conditions
  withStandardChecks: function(value, options, f){
    options = options || {};

    if(options.allowBlank && !this.presence(value)) return true;
    if(options.unless && options.unless.call()) return true;
    if(options['if'] && !options['if'].call()) return true;

    return f.call();
  },

  // **pie.validator.ccNumber**
  //
  // Determine whether the provided value looks like a credit card number.
  // It ensures a number, that it has an appropriate length,
  // and that it passes the luhn check.
  //
  // ```
  // validator.ccNumber("4242 4242 4242 4242")
  // //=> true
  // validator.ccNumber("4242 4242")
  // //=> false
  // validator.ccNumber("4242 4244 4442 4242")
  // //=> false
  // ```
  ccNumber: (function(){
    /* http://rosettacode.org/wiki/Luhn_test_of_credit_card_numbers#JavaScript */
    /* for checking credit card validity */
    var luhnCheck = function(a) {
      var b,c,d,e;
      for(d = +a[b = a.length-1], e=0; b--;)
        c = +a[b], d += ++e % 2 ? 2 * c % 10 + (c > 4) : c;
      return !(d%10);
    };

    return function(value, options){
      return this.withStandardChecks(value, options, function(){

        // don't get rid of letters because we don't want a mix of letters and numbers passing through
        var sanitized = String(value).replace(/[^a-zA-Z0-9]/g, '');
        return this.number(sanitized) &&
               this.length(sanitized, {gte: 10, lte: 16}) &&
               luhnCheck(sanitized);
      }.bind(this));
    };
  })(),

  // **pie.validator.ccExpirationMonth**
  //
  // Ensures the provided value is a valid month (1-12).
  ccExpirationMonth: function(value, options) {
    return this.withStandardChecks(value, options, function() {
      return this.integer(value, {gte: 1, lte: 12});
    }.bind(this));
  },


  // **pie.validator.ccExpirationYear**
  //
  // Ensures the provided value is a valid credit card year.
  // It assumes the minimum is this year, and the maximum is 20 years from now.
  ccExpirationYear: function(value, options) {
    return this.withStandardChecks(value, options, function() {
      var now = new Date();
      return this.integer(value, {gte: now.getFullYear(), lte: now.getFullYear() + 20});
    }.bind(this));
  },


  // **pie.validator.ccSecurity**
  //
  // Ensures a well-formed cvv value.
  // It must be a number between 3 and 4 characters long.
  ccSecurity: function(value, options) {
    return this.withStandardChecks(value, options, function() {
      return this.number(value) &&
              this.length(value, {gte: 3, lte: 4});
    }.bind(this));
  },


  // **pie.validator.chosen**
  //
  // Ensures the provided value is present. To be used for select boxes,
  // radios, and checkboxes.
  // If the value is an array, it will check to see if there is at least one
  // value in the array.
  // ```
  // validator.chosen("")
  // //=> false
  // validator.chosen("foo")
  // //=> true
  // validator.chosen([])
  // //=> false
  // validator.chosen(["foo"])
  // //=> true
  // validator.chosen([""])
  // //=> false
  // ```
  chosen: (function(){

    var valueCheck = function(value){
      return value != null && value !== '';
    };

    return function(value, options){
      return this.withStandardChecks(value, options, function(){
        if(Array.isArray(value)) {
          return !!value.filter(valueCheck).length;
        }
        return valueCheck(value);
      });
    };
  })(),


  // **pie.validator.date**
  //
  // Determines if the provided value is a date (in the form of an iso8601 timestamp or iso8601 date - "yyyy-mm-dd").
  // Optionally, you may pass any range options for comparison.
  // ```
  // validator.date("2015-04-01")
  // //=> true
  // validator.date("2012-00-00")
  // //=> false
  // validator.date("2015-13-01")
  // //=> false
  // d.setDate("2022-10-10", {gte: new Date()});
  // //=> true
  // ```
  date: function(value, options) {
    options = options || {};
    return this.withStandardChecks(value, options, function() {
      var split = value.split('-'), y = split[0], m = split[1], d = split[2], iso, date;

      if(!y || !m || !d) return false;
      if(!this.length(y, {eq: 4}) || !this.length(m, {eq: 2}) || !this.length(d, {eq: 2})) return false;
      if(!this.number(y) || !this.number(m, {gte: 1, lte: 12}) || !this.number(d, {gte: 1, lte: 31})) return false;

      date = new Date(y, m-1, d);

      /* ensure the date is actually in the defined month */
      if(date.getDate() !== parseInt(d, 10)) return false;

      if(!options.sanitized) {
        Object.keys(options).forEach(function(k){
          iso = options[k];
          iso = this.app.i18n.l(iso, 'isoDate');
          options[k] = iso;
        });
        options.sanitized = true;
      }

      var ro = pie.validator.rangeOptions.create(this.app, options);
      return ro.matches(value);

    }.bind(this));
  },


  // **pie.validator.email**
  //
  // Loosely checks the validity of an email address.
  // It simply looks for something in the form of [a]@[b].[c]
  // ```
  // validator.email("foo@bar.com")
  // //=> true
  // validator.email("foo@bar")
  // //=> false
  // validator.email("foo@bar.baz.com")
  // //=> true
  // ```
  email: function(value, options) {
    options = pie.object.merge({allowBlank: false}, options || {});
    return this.withStandardChecks(value, options, function(){
      return (/^.+@.+\..+$/).test(value);
    });
  },

  // **pie.validator.fn**
  //
  // A generic function interface. This enables a function to be passed,
  // along with all the normal options. Asynchronous functions should return
  // a promise.
  // ```
  // var opts = {fn: function(v){ return v.length === 3; }};
  // validator.fn("foo", opts);
  // //=> true
  // validator.fn("foos", opts);
  // //=> false
  // ```
  fn: function(value, options) {
    return this.withStandardChecks(value, options, function(){
      return options.fn.call(null, value, options);
    });
  },


  // **pie.validator.format**
  //
  // Determine if a value matches a given format. The format, provided via the `format` option, can be a regular expression
  // or a named format as defined by the validator instance's `formats` option.
  // By default, named formats include `isoDate`, `isoTime`, `epochs` (epoch seconds), and `epochms` (epoch milliseconds).
  // ```
  // validator.format("foo", {format: /oo/});
  // //=> true
  // validator.format("bar", {format: /oo/});
  // //=> false
  // validator.format("2015-04-20", {format: 'isoDate'});
  // //=> true
  // validator.format("2015-04-20", {format: 'isoTime'});
  // //=> false
  // ```
  format: function(value, options) {
    options = options || {};
    return this.withStandardChecks(value, options, function() {
      var fmt = options.format || options['with'];
      fmt = this.options.formats[fmt] || fmt;
      return !!fmt.test(String(value));
    }.bind(this));
  },


  // **pie.validator.inclusion**
  //
  // Is the value part of the expected list?
  // The list is defined via the `in` option and can either be an array, object, or function.
  // In the case of a function, it is evaluated and the result is used as the list.
  // In the case of an array, the array is checked for `value`'s inclusion.
  // In the case of an object, the `value` is checked for equality.
  // ```
  // validator.inclusion("foo", {in: "foo"});
  // //=> true
  // validator.inclusion("foo", {in: "food"});
  // //=> false
  // validator.inclusion("foo", {in: ["foo"]});
  // //=> true
  // validator.inclusion("foo", {in: []});
  // //=> true, because the "in" option is considered blank.
  // validator.inclusion("foo", {in: function(){ return ["bar"] }});
  // //=> false
  // validator.inclusion("foo", {in: function(){ return ["bar", "foo"] }});
  // //=> true
  // ```
  inclusion: function(value, options) {
    options = options || {};
    return this.withStandardChecks(value, options, function() {
      var inVal = pie.fn.valueFrom(options['in']);
      if(Array.isArray(inVal)) return !inVal.length || !!~inVal.indexOf(value);
      return inVal == null || inVal === value;
    });
  },

  // **pie.validator.integer**
  //
  // Check if a value is an integer, not based on precision but based on value.
  // ```
  // validator.integer(4)
  // //=> true
  // validator.integer(4.4)
  // //=> false
  // validator.integer(4.0)
  // //=> true
  // validator.integer("4.0")
  // //=> true
  // validator.integer(3, {gt: 1, lte: 10})
  // //=> true
  // validator.integer(3.5, {gt: 1, lte: 10})
  // //=> false
  // ```
  integer: function(value, options){
    return  this.withStandardChecks(value, options, function(){
      return  this.number(value, options) &&
              parseInt(value, 10) === parseFloat(value, 10);
    }.bind(this));
  },


  // **pie.validator.length**
  //
  // Is the length of `value` within the desired range?
  // If the value is an array it will use the array's length, otherwise, it will use the length of the String cast version of the value.
  // If no ranges are given, it checks for a length of greater than 0
  // ```
  // validator.length("foo")
  // //=> true
  // validator.length("")
  // //=> false
  // validator.length("foo", {gte: 2, lte: 3})
  // //=> true
  // validator.length(["foo"], {gte: 2, lte: 3})
  // //=> false
  // validator.length([""])
  // //=> true
  // ```
  length: function(value, options){
    options = pie.object.merge({allowBlank: false}, options);

    /* preparation to use the number validator */
    if(!pie.object.hasAny(options, 'gt', 'gte', 'lt', 'lte', 'eq')){
      options.gt = 0;
    }

    return this.withStandardChecks(value, options, function(){
      var length = Array.isArray(value) ? value.length : String(value).trim().length;
      return this.number(length, options);
    }.bind(this));
  },


  // **pie.validator.number**
  //
  // Must be a number and in the given range.
  // ```
  // validator.number(4)
  // //=> true
  // validator.number(4.4)
  // //=> false
  // validator.number("alpha")
  // //=> false
  // validator.number("4.0")
  // //=> true
  // validator.number(3, {gt: 1, lte: 10})
  // //=> true
  // validator.number(20, {gt: 1, lte: 10})
  // //=> false
  // ```
  number: function(value, options){
    options = options || {};

    return this.withStandardChecks(value, options, function(){

      value = String(value).trim();
      /* not using parseFloat because it accepts multiple decimals */
      /* ip addresses would be considered numbers if parseFloat was used */
      if(!/^([\-])?([\d]+)?\.?[\d]+$/.test(value)) return false;

      var number = parseFloat(value),
      ro = pie.validator.rangeOptions.create(this.app, options);

      return ro.matches(number);
    });
  },

  // **pie.validator.phone**
  //
  // Remove whitespace and unecessary characters and ensure we have a 10 digit number.
  // clean out all things that are not numbers and + and get a minimum of 10 digits.
  // If you want a locale based phone validation, use the format validator.
  // ```
  // validator.phone("555-555-5555")
  // //=> true
  // validator.phone("555-5555")
  // //=> false
  // validator.phone("(555) 555-5555")
  // //=> true
  // validator.phone("+15555555555")
  // //=> true
  // validator.phone("555-555-5555 on weekdays")
  // //=> true
  // ```
  phone: function(value, options) {
    options = pie.object.merge({allowBlank: false}, options || {});

    return this.withStandardChecks(value, options, function(){
      var clean = String(value).replace(/[^\+\d]+/g, '');
      return this.length(clean, {gte: 10});
    }.bind(this));
  },


  // **pie.validator.presence**
  //
  // Check if a value is truthy and has any non-whitespace characters.
  // ```
  // validator.presence(null)
  // //=> false
  // validator.presence("")
  // //=> false
  // validator.presence("   ")
  // //=> false
  // validator.presence(false)
  // //=> false
  // validator.presence(true)
  // //=> true
  // validator.presence("foo")
  // //=> true
  // ```
  presence: function(value, options){
    return this.withStandardChecks(value, pie.object.merge({}, options, {allowBlank: false}), function(){
      return !!(value && (/[^ ]/).test(String(value)));
    });
  },

  // **pie.validator.uniqueness**
  //
  // Determine whether the given value is unique within the array defined by the `within` option.
  // The `within` option can be an array or a function which returns an array.
  // ```
  // validator.uniqueness("foo", {within: ["foo", "bar"]})
  // //=> true
  // validator.uniqueness("foo", {within: ["foo", "bar", "foo"]})
  // //=> false
  // validator.uniqueness("foo", {within: function(){ return ["foo", "bar"]; }});
  // //=> true
  // ```
  uniqueness: function(value, options) {
    return this.withStandardChecks(value, options, function() {

      if(!options.within) return true;
      var within = pie.fn.valueFrom(options.within), i = 0, cnt = 0;
      for(; i < within.length; i++) {
        if(within[i] === value) cnt++;
        if(cnt > 1) return false;
      }

      return true;
    });
  },

  // **pie.validator.url**
  //
  // Determine whether `value` loosely looks like a url.
  // For a more complicated url check, use the format validator.
  // ```
  // validator.url("http://www.google.com")
  // //=> true
  // validator.url("https://www.google.com")
  // //=> true
  // validator.url("www.google.com")
  // //=> false
  // ```
  url: function(value, options) {
    options = pie.object.merge({}, options, {format: /^https?\:\/\/.+\..+$/});
    return this.format(value, options);
  }

});



// ## Pie Range Options
//
// A small utilitly class which matches range options to comparators.
// ```
// range = pie.validator.rangeOptions.create(app, {gte: 3, lt: 8});
// range.matches(3)
// //=> true
// range.matches(10)
// //=> false
// ```
pie.validator.rangeOptions = pie.base.extend('rangeOptions', {

  init: function(app, hash) {
    this.i18n = app.i18n;
    this.rangedata = hash || {};
    /* for double casting situations */
    if(pie.object.has(this.rangedata, 'rangedata')) this.rangedata = this.rangedata.rangedata;

    this._super();
  },

  get: function(key) {
    return pie.fn.valueFrom(this.rangedata[key]);
  },

  has: function(key) {
    return pie.object.has(this.rangedata, key);
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

      return pie.array.toSentence(pie.array.compact(s, true), this.i18n).trim();
    }
  }
});

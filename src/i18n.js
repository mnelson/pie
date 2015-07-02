// # Pie i18n
// The i18n class is in charge of the defining and lookup of translations, the
// defining and lookup of date formats, and the standardization of "word" things.
// The standard i18n lookup usage is as follows:
//
// ```
// i18n.load({
//   hi: "Hi %{firstName}",
//   followers: {
//     zero: "${hi}, you don't have any followers :(",
//     one: "${hi}, you have a follower!",
//     other: ${hi}, you have %{count} followers!"
// });
//
// i18n.t("hi");
// //=> "Hi undefined"
// i18n.t("hi", {firstName: 'Doug'});
// //=> "Hi Doug"
// i18n.t("hi", {firstName: 'Doug'}, 'upcase');
// //=> "HI DOUG"
// i18n.t("followers", {firstName: 'Doug', count: 5});
// //=> "Hi Doug, you have 5 followers!"
// i18n.t("followers", {firstName: 'Doug', count: 0});
// //=> "Hi Doug, you don't have any followers :("
// ```
// Note that recursive interpolation is allowed via the `${}` identifier. Direct interpolation is
// handled by `%{}`. There is no loop detection so use this wisely.
//
// And date/time usage is as follows:
//
// ```
// i18n.l(date, '%Y-%m');
// //=> "2015-01"
// i18n.l(date, 'isoTime');
// //=> "2015-01-14T09:42:26.069-05:00"
// ```

// _**Todo:** allow a default scope (eg, en, en-GB, etc). Currently the assumption is that only the relevant translations are loaded._
pie.i18n = pie.model.extend('i18n', (function(){

  var extension = {

    init: function(app, options) {
      var data = pie.object.merge({}, pie.i18n.defaultTranslations);
      options = pie.object.deepMerge({
        settings: {
          interpolationStart: '%{',
          interpolationEnd: '}',
          nestedStart: '${',
          nestedEnd: '}'
        }
      }, options || {}, {app: app});


      var escapedInterpEnd = pie.string.escapeRegex(options.settings.interpolationEnd),
      escapedNestedEnd = pie.string.escapeRegex(options.settings.nestedEnd);

      options.settings.interpolationRegex = new RegExp(pie.string.escapeRegex(options.settings.interpolationStart) + '([^' + escapedNestedEnd + ']+)' + escapedInterpEnd, 'g');
      options.settings.nestedRegex = new RegExp(pie.string.escapeRegex(options.settings.nestedStart) + '([^' + escapedNestedEnd + ']+)' + escapedNestedEnd, 'g');

      pie.object.forEach(this.strftimeMods, function(k,v){
        this.strftimeMods[k] = v.bind(this);
      }.bind(this));

      this._super(data, options);
    },

    _ampm: function(num) {
      return this.t('app.time.meridiems.' + (num >= 12 ? 'pm' : 'am'));
    },


    _countAlias: {
      '0' : 'zero',
      '1' : 'one',
      '-1' : 'negone'
    },


    _dayName: function(d) {
      return this.t('app.time.day_names.' + d);
    },


    _hour: function(h) {
      if(h > 12) h -= 12;
      if(!h) h += 12;
      return h;
    },


    _monthName: function(m) {
      return this.t('app.time.month_names.' + m);
    },


    _nestedTranslate: function(t, data) {
      return this._expand(t, this.options.settings.nestedRegex, function(match, path) {
        return this.translate(path, data);
      }.bind(this));
    },

    _interpolateTranslation: function(t, data) {
      return this._expand(t, this.options.settings.interpolationRegex, function(match, key) {
        return pie.object.getPath(data, key);
      });
    },

    _expand: function(t, regex, fn) {
      try{
        var val;
        return t.replace(regex, function(match, key) {
          val = fn(match, key);
          if(val === undefined) throw new Error("Missing interpolation argument `" + key + "` for '" + t + "'");
          return val;
        });
      } catch(e) {
        this.app.errorHandler.handleI18nError(e, {
          handledBy: "pie.i18n#_expand",
          expandString: t,
          regex: regex
        });
        return "";
      }
    },


    /* assumes that dates either come in as dates, iso strings, or epoch timestamps */
    _normalizedDate: function(d) {
      if(String(d).match(/^\d+$/)) {
        d = parseInt(d, 10);
        if(String(d).length < 13) d *= 1000;
        d = new Date(d);
      } else if(pie.object.isString(d)) {
        d = pie.date.timeFromISO(d);
      } else {
        /* let the system parse */
        d = new Date(d);
      }
      return d;
    },


    _shortDayName: function(d) {
      return this.t('app.time.short_day_names.' + d, {'default' : ''}) || this._dayName(d).slice(0, 3);
    },

    _formattedDayName: function(d) {
      if(this._isToday(d)) return this.t('app.time.today');
      if(this._isTomorrow(d)) return this.t('app.time.tomorrow');
      return this._dayName(d.getDay());
    },

    _formattedShortDayName: function(d) {
      if(this._isToday(d)) return this.t('app.time.today');
      if(this._isTomorrow(d)) return this.t('app.time.tomorrow');
      return this._shortDayName(d.getDay());
    },

    _isToday: function(date) {
      var now = new Date();
      return now.getFullYear() === date.getFullYear() &&
        now.getMonth() === date.getMonth() &&
        now.getDate() === date.getDate();
    },

    _isTomorrow: function(date) {
      var tom = new Date();
      tom.setDate(tom.getDate() + 1);
      return tom.getFullYear() === date.getFullYear() &&
        tom.getMonth() === date.getMonth() &&
        tom.getDate() === date.getDate();
    },


    _shortMonthName: function(m) {
      return this.t('app.time.short_month_names.' + m, {'default' : ''}) || this._monthName(m).slice(0, 3);
    },


    _pad: function(num, cnt, pad, prefix) {
      var s = '',
          p = cnt - num.toString().length;
      if(pad === undefined) pad = ' ';
      while(p>0){
        s += prefix ? pad + s : s + pad;
        p -= 1;
      }
      return s + num.toString();
    },

    _ordinal: function(number) {
      var unit = number % 100;

      if(unit >= 11 && unit <= 13) unit = 0;
      else unit = number % 10;

      return this.t('app.time.ordinals.o' + unit);
    },

    _timezoneAbbr: function(date) {
      var str = date && date.toString();
      return str && str.split(/\((.*)\)/)[1];
    },


    _utc: function(t) {
      var t2 = new Date(t.getTime());
      t2.setMinutes(t2.getMinutes() + t2.getTimezoneOffset());
      return t2;
    },

    keyCheck: /^\.(.+)$/,

    // ** pie.i18n.attempt **
    //
    // If the provided `key` looks like a translation key, prepended with a ".",
    // try to look it up. If it does not or the provided key does not exist, return
    // the provided key.
    // ```
    // i18n.attempt('.foo.bar.baz')
    // ```
    attempt: function(/* args */) {
      var args = pie.array.from(arguments),
      key = args[0],
      m = key && key.match(this.keyCheck);

      if(!m) return key;

      args[0] = m[1]; /* swap out the formatted key for the real one */
      return this.translate.apply(this, args);
    },

    // ** pie.i18n.load **
    //
    // Load translations into this instance.
    // By default, a deep merge will occur, provide `false` for `shallow`
    // if you would like a shallow merge to occur.
    // ```
    // i18n.load({foo: 'Bar %{baz}'});
    // ```
    load: function(data, shallow) {
      var f = shallow ? pie.object.merge : pie.object.deepMerge;
      f.call(null, this.data, data);
    },

    // ** pie.i18n.translate (pie.i18n.t) **
    //
    // Given a `path`, look up a translation.
    // If the second argument `data` is provided, the `data` will be
    // interpolated into the translation before returning.
    // Arguments 3+ are string modification methods as defined by `pie.string`.
    // `translate` is aliased as `t`.
    // ```
    // //=> Assuming 'foo.path' is defined as "This is %{name}"
    // i18n.t('foo.path', {name: 'Bar'}, 'pluralize', 'upcase')
    // //=> "THIS IS BAR'S"
    // ```
    translate: function(/* path, data, stringChange1, stringChange2 */) {
      var changes = pie.array.change(arguments, 'from', 'compact'),
      path = changes.shift(),
      data = pie.object.isObject(changes[0]) ? changes.shift() : undefined,
      translation = this.get(path),
      count;

      if (pie.object.has(data, 'count') && pie.object.isObject(translation)) {
        count = (data.count || 0).toString();
        count = this._countAlias[count] || (count > 0 ? 'other' : 'negother');
        translation = translation[count] === undefined ? translation.other : translation[count];
      }

      if(!translation) {

        if(pie.object.has(data, 'default')) {
          var def = pie.fn.valueFrom(data.default);
          if(pie.object.isString(def)) {
            translation = this.attempt(def);
          } else {
            translation = def;
          }
        } else if(translation == null) {
          this.app.errorHandler.handleI18nError(new Error("Translation not found: " + path), {
            handledBy: "pie.i18n#translate",
            translationPath: path
          });
          return "";
        }
      }


      if(pie.object.isString(translation)) {
        translation = translation.indexOf(this.options.settings.nestedStart) === -1 ? translation : this._nestedTranslate(translation, data);
        translation = translation.indexOf(this.options.settings.interpolationStart) === -1 ? translation : this._interpolateTranslation(translation, data);
      }

      if(changes.length) {
        changes.unshift(translation);
        translation = pie.string.change.apply(null, changes);
      }

      return translation;
    },

    // ** pie.i18n.timeago **
    //
    // Return a human representation of the time since the provided time `t`.
    // You can also pass an alternate "relative to" time as the second argument.
    // ```
    // d.setDate(d.getDate() - 4);
    // i18n.timeago(d)
    // //=> "4 days ago"
    //
    // d.setDate(d.getDate() - 7);
    // i18n.timeago(d)
    // //=> "1 week ago"
    //
    // d.setDate(d.getDate() - 90);
    // d2.setDate(d.getDate() + 2);
    // i18n.timeago(d, d2)
    // //=> "2 days ago"
    // ```
    timeago: function(t, now, scope) {
      var tD = t,
      nowD = now,
      diff, c;

      t = this._normalizedDate(t).getTime()  / 1000;
      now = this._normalizedDate(now || new Date()).getTime() / 1000;

      diff = now - t;

      scope = scope || 'app';

      if(diff < 60) { // less than a minute
        return this.t(scope + '.timeago.now', {count: diff});
      } else if (diff < 3600) { // less than an hour
        c = Math.floor(diff / 60);
        return this.t(scope + '.timeago.minutes', {count: c});
      } else if (diff < 86400) { // less than a day
        c = Math.floor(diff / 3600);
        return this.t(scope + '.timeago.hours', {count: c});
      } else if (diff < 86400 * 7) { // less than a week
        c = Math.floor(diff / 86400);
        return this.t(scope + '.timeago.days', {count: c});
      } else if (diff < 86400 * 30) { // less than 30 days
        c = Math.floor(diff / (86400 * 7));
        return this.t(scope + '.timeago.weeks', {count: c});
      } else if (diff < 86500 * 365) { // less than 365 days
        c = (nowD.getFullYear() - tD.getFullYear()) * 12;
        c -= tD.getMonth();
        c += nowD.getMonth();
        return this.t(scope + '.timeago.months', {count: c});
      } else {
        c = Math.floor(diff / (86400 * 365));
        return this.t(scope + '.timeago.years', {count: c});
      }
    },

    // ** pie.i18n.strftime (pie.i18n.l) **
    //
    // Given a `date`, format it based on the format `f`.
    // The format can be:
    //   * A named format, existing at app.time.formats.X
    //   * A custom format following the guidelines of ruby's strftime
    //
    // *Ruby's strftime: http://ruby-doc.org/core-2.2.0/Time.html#method-i-strftime*
    //
    // ```
    // i18n.l(date, 'shortDate');
    // i18n.l(date, '%Y-%m');
    // ```
    strftime: function(date, f) {
      this._date = this._normalizedDate(date);

      /* named format from translations.time. */
      if(!~f.indexOf('%')) f = this.t('app.time.formats.' + f, {"default" : f});

      pie.object.forEach(this.strftimeMods, function(pattern, fn) {
        f = f.replace(pattern, fn);
      });

      delete this._date;
      return f;
    },

    strftimeMods: {
      '%a'   : function(){  return this._shortDayName(this._date.getDay()); },
      '%-a'  : function() { return this._formattedShortDayName(this._date, this._date.getDay()); },
      '%A'   : function() { return this._dayName(this._date.getDay()); },
      '%-A'  : function() { return this._formattedDayName(this._date, this._date.getDay()); },
      '%B'   : function() { return this._monthName(this._date.getMonth()); },
      '%b'   : function() { return this._shortMonthName(this._date.getMonth()); },
      '%d'   : function() { return this._pad(this._date.getDate(), 2, '0'); },
      '%-d'  : function() { return this._date.getDate(); },
      '%+d'  : function() { return this._date.getDate() + this._ordinal(this._date.getDate()); },
      '%e'   : function() { return this._pad(this._date.getDate(), 2, ' '); },
      '%H'   : function() { return this._pad(this._date.getHours(), 2, '0'); },
      '%-H'  : function() { return this._date.getHours(); },
      '%k'   : function() { return this._pad(this._date.getHours(), 2, ' '); },
      '%-k'  : function() { return this._date.getHours(); },
      '%I'   : function() { return this._pad(this._hour(this._date.getHours()), 2, '0'); },
      '%l'   : function() { return this._hour(this._date.getHours()); },
      '%m'   : function() { return this._pad(this._date.getMonth() + 1, 2, '0'); },
      '%-m'  : function() { return this._date.getMonth() + 1; },
      '%M'   : function() { return this._pad(this._date.getMinutes(), 2, '0'); },
      '%p'   : function() { return this._ampm(this._date.getHours()).toUpperCase(); },
      '%P'   : function() { return this._ampm(this._date.getHours()); },
      '%S'   : function() { return this._pad(this._date.getSeconds(), 2, '0'); },
      '%-S'  : function() { return this._date.getSeconds(); },
      '%L'   : function() { return this._pad(this._date.getMilliseconds(), 3, '0'); },
      '%-L'  : function() { return this._date.getMilliseconds(); },
      '%w'   : function() { return this._date.getDay(); },
      '%y'   : function() { return this._pad(this._date.getFullYear() % 100, 2, '0'); },
      '%Y'   : function() { return this._date.getFullYear(); },
      '%Z'   : function() { return this._timezoneAbbr(this._date); },
      '%z'   : function() {
        var offset = this._date.getTimezoneOffset();
        var absOffsetHours    = Math.floor(Math.abs(offset / 60));
        var absOffsetMinutes  = Math.abs(offset) - (absOffsetHours * 60);
        return (offset > 0 ? "-" : "+") + this._pad(absOffsetHours, 2, '0') + this._pad(absOffsetMinutes, 2, '0');
      },
      '%:z' : function() {
        var tzOffset = this.strftimeMods['%z']();
        return tzOffset.slice(0,3) + ':' + tzOffset.slice(3);
      }
    }
  };

  extension.t = extension.translate;
  extension.l = extension.strftime;

  return extension;
})());

pie.i18n.defaultTranslations = {
  app: {
    sentence: {
      conjunction: ' and ',
      delimeter: ', '
    },

    timeago: {
      now: "just now",
      minutes: {
        one:    "%{count} minute ago",
        other:  "%{count} minutes ago"
      },
      hours: {
        one:    "%{count} hour ago",
        other:  "%{count} hours ago"
      },
      days: {
        one:    "%{count} day ago",
        other:  "%{count} days ago"
      },
      weeks: {
        one:    "%{count} week ago",
        other:  "%{count} weeks ago"
      },
      months: {
        one:    "%{count} month ago",
        other:  "%{count} months ago"
      },
      years: {
        one:    "%{count} year ago",
        other:  "%{count} years ago"
      }
    },
    time: {
      today: "Today",
      tomorrow: "Tomorrow",
      formats: {
        isoDate:    '%Y-%m-%d',
        isoTime:    '%Y-%m-%dT%H:%M:%S.%L%:z',
        shortDate:  '%m/%d/%Y',
        longDate:   '%B %+d, %Y'
      },
      meridiems: {
        am: 'am',
        pm: 'pm'
      },
      ordinals: {
        o0: "th",
        o1: "st",
        o2: "nd",
        o3: "rd",
        o4: "th",
        o5: "th",
        o6: "th",
        o7: "th",
        o8: "th",
        o9: "th"
      },
      day_names: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      ],
      short_day_names: [
        'Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat'
      ],
      month_names: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ],
      short_month_names: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ]
    },

    validations: {

      ccNumber:           "does not look like a credit card number",
      ccSecurity:         "is not a valid security code",
      ccExpirationMonth:  "is not a valid expiration month",
      ccExpirationYear:   "is not a valid expiration year",
      ccExpirationDate:   "is not a valid expiration date",
      chosen:             "must be chosen",
      date:               "is not a valid date",
      email:              "must be a valid email",
      format:             "is invalid",
      inclusion:          "is not a valid value",
      integer:            "must be an integer",
      length:             "length must be",
      number:             "must be a number",
      phone:              "is not a valid phone number",
      presence:           "can't be blank",
      uniqueness:         "is not unique",
      url:                "must be a valid url",

      range_messages: {
        eq:  "equal to %{count}",
        lt:  "less than %{count}",
        gt:  "greater than %{count}",
        lte: "less than or equal to %{count}",
        gte: "greater than or equal to %{count}"
      }
    }
  }
};

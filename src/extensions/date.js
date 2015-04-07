var PieDate = {
  // takes a iso date string and converts to a local time representing 12:00am, on that date.
  dateFromISO: function(isoDateString) {
    if(!isoDateString) return null;
    var parts = isoDateString.split(/T|\s/)[0].split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  },


  // current timestamp
  now: function(secondsPlease) {
    var t = new Date().getTime();
    if(secondsPlease) t = parseInt(t / 1000, 10);
    return t;
  },

  /**
   * STOLEN FROM HERE:
   * Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
   * © 2011 Colin Snover <http://zetafleet.com>
   * Released under MIT license.
   */

  timeFromISO: (function() {

    var numericKeys = [1, 4, 5, 6, 7, 10, 11];

    return function(date) {
      if(!date) return NaN;
      if(!/T|\s/.test(date)) return PieDate.dateFromISO(date);

      var timestamp, struct, minutesOffset = 0;

      // ES5 §15.9.4.2 states that the string should attempt to be parsed as a Date Time String Format string
      // before falling back to any implementation-specific date parsing, so that’s what we do, even if native
      // implementations could be faster
      //              1 YYYY                2 MM       3 DD           4 HH    5 mm       6 ss        7 msec        8 Z 9 ±    10 tzHH    11 tzmm
      if ((struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec(date))) {
        // avoid NaN timestamps caused by “undefined” values being passed to Date.UTC
        for (var i = 0, k; (k = numericKeys[i]); ++i) {
          struct[k] = +struct[k] || 0;
        }

        // allow undefined days and months
        struct[2] = (+struct[2] || 1) - 1;
        struct[3] = +struct[3] || 1;

        if (struct[8] !== 'Z' && struct[9] !== undefined) {
          minutesOffset = struct[10] * 60 + struct[11];

          if (struct[9] === '+') {
            minutesOffset = 0 - minutesOffset;
          }
        }

        timestamp = Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]);
      } else {
        timestamp = NaN;
      }

      return new Date(timestamp);
    };

  })()
};

module.exports = PieDate;

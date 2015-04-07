var Obj = require('./object');

var Browser = {
  /* From old jQuery */
  agent: function() {
    if(Browser.__agent) return Browser.__agent;

    var ua = global.navigator.userAgent.toLowerCase(),
    match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
      /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
      /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
      /(msie) ([\w.]+)/.exec( ua ) ||
      ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
      [];

    var b = {
      browser: match[ 1 ] || "",
      version: match[ 2 ] || "0"
    };

    if(b.browser) {
      b[b.browser] = true;
    }

    // Chrome is Webkit, but Webkit is also Safari.
    if ( b.chrome ) {
      b.webkit = true;
    } else if ( b.webkit ) {
      b.safari = true;
    }

    return Browser.__agent = b;
  },

  getCookie: function(key, options) {
    var decode = options && options.raw ? function(s) { return s; } : decodeURIComponent,
    pairs = global.document.cookie.split('; '),
    pair;

    for(var i = 0; i < pairs.length; i++) {
      pair = pairs[i];
      if(!pair) continue;

      pair = pair.split('=');
      if(decode(pair[0]) === key) return decode(pair[1] || '');
    }

    return null;
  },


  isRetina: function() {
    return global.window.devicePixelRatio > 1;
  },


  isTouchDevice: function() {
    return Obj.has(global.window, 'ontouchstart') ||
      (global.window.DocumentTouch && global.document instanceof global.window.DocumentTouch) ||
      global.navigator.MaxTouchPoints > 0 ||
      global.navigator.msMaxTouchPoints > 0;
  },

  testMediaQuery: function(query) {
    query = Browser.mediaQueries[query] || query;
    var matchMedia = global.window.matchMedia || global.window.msMatchMedia;
    if(matchMedia) return matchMedia(query).matches;
    return undefined;
  },

  orientation: function() {
    switch (global.window.orientation) {
    case 90:
    case -90:
      return 'landscape';
    default:
      return 'portrait';
    }
  },

  setCookie: function(key, value, options) {
    options = Obj.merge({}, options);

    /* jslint eqnull:true */
    if(value == null) options.expires = -1;

    if (Obj.isNumber(options.expires)) {
      var days = options.expires;
      options.expires = new Date();
      options.expires.setDate(options.expires.getDate() + days);
    }

    value = String(value);

    var cookieValue = [
      encodeURIComponent(key), '=', options.raw ? value : encodeURIComponent(value),
      options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
      options.path    ? '; path=' + options.path : '',
      options.domain  ? '; domain=' + options.domain : '',
      options.secure  ? '; secure' : ''
    ].join('');

    global.document.cookie = cookieValue;
    return cookieValue;
  }
};


module.exports = Browser;

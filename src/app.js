var Ajax          = require('ajax');
var Arr           = require('extensions/array');
var Base          = require('base');
var Cache         = require('cache');
var Config        = require('config');
var Container     = require('mixins/container');
var Dom           = require('extensions/dom');
var Emitter       = require('emitter');
var ErrorHandler  = require('errorHandler');
var Helpers       = require('helpers');
var I18n          = require('i18n');
var Model         = require('model');
var Navigator     = require('navigator');
var Notifier      = require('notifier');
var Obj           = require('extensions/object');
var Pie           = require('pie');
var Resources     = require('resources');
var RouteHandler  = require('routeHandler');
var Router        = require('router');
var Templates     = require('templates');
var Validator     = require('validator');

// # Pie App
//
// The app class is the entry point of your application. It acts as the container in charge of managing the page's context.
// It provides access to application utilities, routing, templates, i18n, etc.
// It observes browser and link navigation and changes the page's context automatically.
module.exports = Base.extend('app', {
  init: function(options) {


    /* `Base.prototype.constructor` handles the setting of an app, */
    /* but we don't want a reference to another app within this app. */
    delete this.app;

    /* Set a global instance which can be used as a backup within the pie library. */
    Pie.appInstance = Pie.appInstance || this;

    /* Register with pie to allow for nifty global lookups. */
    Pie.apps[this.pieId] = this;

    /* Default application options. */
    this.options = Obj.deepMerge({
      uiTarget: 'body',
      unsupportedPath: '/browser/unsupported',
      notificationStorageKey: 'js-alerts',
      verifySupport: true
    }, options);

    if(this.options.verifySupport && !this.verifySupport()) {
      window.location.href = this.options.unsupportedPath;
      return;
    }

    // `classOption` allows class configurations to be provided in the following formats:
    // ```
    // new pie.app({
    //   i18n: myCustomI18nClass,
    //   i18nOptions: {foo: 'bar'}
    // });
    // ```
    // which will result in `this.i18n = new myCustomI18nClass(this, {foo: 'bar'});`
    //
    // Alternatively you can provide instances as the option.
    // ```
    // var instance = new myCustomI18nClass();
    // new pie.app({
    //   i18n: instance,
    // });
    // ```
    // which will result in `this.i18n = instance; this.i18n.app = this;`
    var classOption = function(key, _default){
      var k = this.options[key] || _default,
      opt = this.options[key + 'Options'] || {};

      if(Obj.isFunction(k)) {
        return new k(this, opt);
      } else {
        k.app = this;
        return k;
      }
    }.bind(this);


    // `app.config` is a model used to manage configuration objects.
    this.config = classOption('config', Config);

    // `app.cache` is a centralized cache store to be used by anyone.
    this.cache = classOption('cache', Cache);

    // `app.emitter` is an interface for subscribing and observing app events
    this.emitter = classOption('emitter', Emitter);

    // `app.i18n` is the translation functionality
    this.i18n = classOption('i18n', I18n);

    // `app.ajax` is ajax interface + app specific functionality.
    this.ajax = classOption('ajax', Ajax);

    // `app.notifier` is the object responsible for showing page-level notifications, alerts, etc.
    this.notifier = classOption('notifier', Notifier);

    // `app.errorHandler` is the object responsible for
    this.errorHandler = classOption('errorHandler', ErrorHandler);

    // After a navigation change, app.parsedUrl is the new parsed route
    this.parsedUrl = new Model({});

    // `app.router` is used to determine which view should be rendered based on the url
    this.router = classOption('router', Router);

    // `app.routeHandler` extracts information from the current route and determines what to do with it.
    this.routeHandler = classOption('routeHandler', RouteHandler);

    // `app.resources` is used for managing the loading of external resources.
    this.resources = classOption('resources', Resources);

    // Template helper methods are evaluated to the local variable `h` in templates.
    // Any methods registered with this helpers module will be available in templates
    // rendered by this app's `templates` object.
    this.helpers = classOption('helpers', Helpers);

    // `app.templates` is used to manage and render application templates.
    this.templates = classOption('templates', Templates);

    // `app.navigator` is the only navigator which should exist and be used within this app.
    // Multiple apps and navigators can exist but one must take the lead for actually changing
    // browser state. See more in the navigator class.
    this.navigator = classOption('navigator', Navigator);

    // `app.validator` a validator intance to be used in conjunction with this app's model activity.
    this.validator = classOption('validator', Validator);

    // We observe the navigator and tell the router to parse the new url
    this.navigator.observe(this.parseUrl.bind(this));

    // Watch for changes to the parsedUrl
    this.parsedUrl.observe(this.parsedUrlChanged.bind(this));


    // Before we get going, observe link navigation & show any notifications stored
    // in localStorage.
    this.emitter.once('beforeStart', this.setupSinglePageLinks.bind(this));
    this.emitter.once('afterStart', this.showStoredNotifications.bind(this));

    if(!this.options.noAutoStart) {
      // Once the dom is loaded, start the app.
      document.addEventListener('DOMContentLoaded', this.start.bind(this));
    }
  },

  // Just in case the client wants to override the standard confirmation dialog.
  // Eventually this could create a confirmation view and provide options to it.
  // The view could have more options but would always end up invoking onConfirm or onDeny.
  confirm: function(options) {
    if(window.confirm(options.text)) {
      if(options.onConfirm) options.onConfirm();
    } else {
      if(options.onDeny) options.onDeny();
    }
  },

  debug: function() {
    if(window.console && window.console.log) {
      window.console.log.apply(window.console, arguments);
    }
  },
  // Use this to navigate. This allows us to apply app-specific navigation logic
  // without altering the underling navigator.
  // This can be called with just a path, a path with a query object, or with notification arguments.
  // app.go('/test-url')
  // app.go('/test-url', true) // replaces state rather than adding
  // app.go(['/test-url', {foo: 'bar'}]) // navigates to /test-url?foo=bar
  // app.go('/test-url', true, 'Thanks for your interest') // replaces state with /test-url and shows the provided notification
  // app.go('/test-url', 'Thanks for your interest') // navigates to /test-url and shows the provided notification
  go: function(){
    var args = Arr.from(arguments), path, notificationArgs, replaceState;

    /* Path is always first. */
    path = args.shift();


    /* Next we check for a query object */
    if(Obj.isPlainObject(args[0])) {
      path = this.router.path(path, args.shift());

    /* If there is no query object we treat the first arg as an array and apply to router.path */
    /* This enables the user to pass anything to the router.path function by providing an array as the first arg */
    } else {
      path = this.router.path.apply(this.router, Arr.from(path));
    }

    if(path === this.parsedUrl.get('fullPath')) return;

    /* If the next argument is a boolean, we care about replaceState */
    if(Obj.isBoolean(args[0])) {
      replaceState = args.shift();
    } else {
      replaceState = false;
    }

    /* Anything left is considered arguments for the notifier. */
    notificationArgs = args;

    if(notificationArgs.length) {
      /* The first argument is the message content, we make sure it's evaluated in our current context */
      /* since we could lose the translation when we move. */
      notificationArgs[0] = this.i18n.attempt(notificationArgs[0]);
    }

    var parsed = this.router.parseUrl(path);
    if(parsed.route && (parsed.view || parsed.redirect)) {

      this.navigator.go(path, {}, replaceState);

      if(notificationArgs.length) {
        this.notifier.notify.apply(this.notifier, notificationArgs);
      }

    } else {

      if(notificationArgs.length) {
        this.store(this.options.notificationStorageKey, notificationArgs);
      }

      this.hardGo(path);
    }
  },

  // Extracted so we can effectively test the logic within `go()` without redirection.
  hardGo: function(path) {
    window.location.href = path;
  },

  // Go back one page.
  goBack: function() {
    window.history.back();
  },

  // Callback for when a link is clicked in our app
  handleSinglePageLinkClick: function(e){

    // If the link is targeting something else, let the browser take over
    if(e.delegateTarget.getAttribute('target')) return;

    // If the user is trying to do something beyond simple navigation, let the browser take over
    if(e.ctrlKey || e.metaKey) return;

    // Extract the location from the link.
    var href = e.delegateTarget.getAttribute('href');

    // If we're going nowhere, somewhere else, or to an anchor on the page, let the browser take over
    if(!href || /^(#|[a-z]+:\/\/)/.test(href)) return;

    // Ensure that relative links are evaluated as relative
    if(href.charAt(0) === '?') href = window.location.pathname + href;

    // Great, we can handle it. let the app decide whether to use pushstate or not
    e.preventDefault();
    this.go(href);
  },

  parseUrl: function() {
    var fromRouter = this.router.parseUrl(this.navigator.get('fullPath'));

    this.parsedUrl.setData(fromRouter);
  },


  parsedUrlChanged: function(changeSet) {
    if(changeSet.has('fullPath')) {
      this.emitter.fire('urlChanged');
    }

    this.routeHandler.handle(changeSet);
  },


  // Reload the page without reloading the browser.
  // Alters the current view's _pieName to appear as invalid for the route.
  refresh: function() {
    var current = this.getChild('currentView');
    current._pieName = '__remove__';
    this.navigationChanged();
  },

  // Safely access localStorage, passing along any errors for reporting.
  retrieve: function(key, clear) {
    var encoded, decoded;

    try {
      if(!window.localStorage) return undefined;

      encoded = window.localStorage.getItem(key);
      decoded = encoded ? JSON.parse(encoded) : undefined;
    } catch(err) {
      this.errorHandler.reportError(err, {
        handledBy: "pie.app#retrieve/getItem",
        key: key
      });
    }

    try {
      if(clear || clear === undefined){
        window.localStorage.removeItem(key);
      }
    } catch(err) {
      this.errorHandler.reportError(err, {
        handledBy: "pie.app#retrieve/removeItem",
        key: key,
        clear: clear
      });
    }

    return decoded;
  },

  // When a link is clicked, go there without a refresh if we recognize the route.
  setupSinglePageLinks: function() {
    var target = Pie.qs(this.options.navigationContainer || this.options.uiTarget);
    Dom.on(target, 'click', this.handleSinglePageLinkClick.bind(this), 'a[href]');
  },

  // Show any notification which have been preserved via local storage.
  showStoredNotifications: function() {
    var messages = this.retrieve(this.options.notificationStorageKey);

    if(messages && messages.length) {
      this.notifier.notify.apply(this.notifier, messages);
    }
  },

  // Start the app by starting the navigator (which we have observed).
  start: function() {
    this.emitter.fireSequence('start', this.navigator.start.bind(this.navigator));
  },

  // Safely access localStorage, passing along any errors for reporting.
  store: function(key, data) {

    var str;
    try {
      if(!window.localStorage) return false;

      str = JSON.stringify(data);
      window.localStorage.setItem(key, str);
      return true;
    } catch(err) {
      this.errorHandler.reportError(err, {
        handledBy: "pie.app#store",
        key: key,
        data: str
      });
    }
  },

  verifySupport: function() {
    var el = document.createElement('_');

    return !!(el.classList &&
      window.history.pushState &&
      Date.prototype.toISOString &&
      Array.isArray &&
      Array.prototype.forEach &&
      Object.keys &&
      Number.prototype.toFixed);
  }
}, Container);

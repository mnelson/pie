// # Pie App
//
// The app class is the entry point of your application. It acts as the container in charge of managing the page's context.
// It provides access to application utilities, routing, templates, i18n, etc.
// It observes browser and link navigation and changes the page's context automatically.
pie.app = pie.base.extend('app', {
  init: function(options) {


    /* `pie.base.create` handles the setting of an app, */
    /* but we don't want a reference to another app within this app. */
    delete this.app;

    /* Set a global instance which can be used as a backup within the pie library. */
    pie.appInstance = pie.appInstance || this;

    /* Register with pie to allow for nifty global lookups. */
    pie.apps[pie.uid(this)] = this;

    /* Default application options. */
    this.options = pie.object.deepMerge({
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
    // pie.app.create({
    //   i18n: myCustomI18nClass,
    //   i18nOptions: {foo: 'bar'}
    // });
    // ```
    // which will result in `this.i18n = myCustomI18nClass.create(this, {foo: 'bar'});`
    //
    // Alternatively you can provide instances as the option.
    // ```
    // var instance = myCustomI18nClass.create();
    // pie.app.create({
    //   i18n: instance,
    // });
    // ```
    // which will result in `this.i18n = instance; this.i18n.app = this;`
    var classOption = function(key, _default){
      var k = this.options[key] || _default,
      opt = this.options[key + 'Options'] || {};

      if(k.__pieRole === 'class') {
        return k.create(this, opt);
      } else if (pie.object.isFunction(k)) {
        return k(this, opt);
      } else {
        k.app = this;
        return k;
      }
    }.bind(this);


    // `app.config` is a model used to manage configuration objects.
    this.config = classOption('config', pie.config);

    // `app.cache` is a centralized cache store to be used by anyone.
    this.cache = classOption('cache', function(){
      return pie.cache.create({}, {app: this});
    }.bind(this));

    // `app.storage` is used for local, session, cache, etc storage
    this.storage = classOption('storage', pie.dataStore);

    // `app.emitter` is an interface for subscribing and observing app events
    this.emitter = classOption('emitter', pie.emitter);

    // `app.i18n` is the translation functionality
    this.i18n = classOption('i18n', pie.i18n);

    // `app.ajax` is ajax interface + app specific functionality.
    this.ajax = classOption('ajax', pie.ajax);

    // `app.notifier` is the object responsible for showing page-level notifications, alerts, etc.
    this.notifier = classOption('notifier', pie.notifier);

    // `app.errorHandler` is the object responsible for
    this.errorHandler = classOption('errorHandler', pie.errorHandler);

    // After a navigation change, app.parsedUrl is the new parsed route
    this.parsedUrl = pie.model.create({});

    // `app.router` is used to determine which view should be rendered based on the url
    this.router = classOption('router', pie.router);

    // `app.routeHandler` extracts information from the current route and determines what to do with it.
    this.routeHandler = classOption('routeHandler', pie.routeHandler);

    // `app.resources` is used for managing the loading of external resources.
    this.resources = classOption('resources', pie.resources);

    // Template helper methods are evaluated to the local variable `h` in templates.
    // Any methods registered with this helpers module will be available in templates
    // rendered by this app's `templates` object.
    this.helpers = classOption('helpers', pie.helpers);

    // `app.templates` is used to manage and render application templates.
    this.templates = classOption('templates', pie.templates);

    // `app.navigator` is the only navigator which should exist and be used within this app.
    // Multiple apps and navigators can exist but one must take the lead for actually changing
    // browser state. See more in the pie.navigator class.
    this.navigator = classOption('navigator', pie.navigator);

    // `app.validator` a validator intance to be used in conjunction with this app's model activity.
    this.validator = classOption('validator', pie.validator);

    // We observe the navigator and tell the router to parse the new url
    this.navigator.observe(this.parseUrl.bind(this));

    // Watch for changes to the parsedUrl
    this.parsedUrl.observe(this.parsedUrlChanged.bind(this));


    // Before we get going, observe link navigation & show any notifications stored
    // in localStorage.
    // Wrapped in a function for testing purposes.
    this.emitter.once('beforeStart', function(){ this.setupSinglePageLinks(); }.bind(this));
    this.emitter.once('afterStart', function(){ this.showStoredNotifications(); }.bind(this));

    if(!this.options.noAutoStart) {
      // Once the dom is loaded, start the app.
      document.addEventListener('DOMContentLoaded', this.start.bind(this));
    }

    this._super();
  },

  // DEPRECATED
  // Safely access localStorage, passing along any errors for reporting.
  retrieve: function(key, clear) {
    return this.storage.get(key, {clear: clear === undefined || clear});
  },

  // Safely access localStorage, passing along any errors for reporting.
  store: function(key, data) {
    return this.storage.set(key, data);
  },

  // END DEPRECATED

  // Just in case the client wants to override the standard confirmation dialog.
  // Eventually this could create a confirmation view and provide options to it.
  // The dialog should return a promise which is resolved if the dialog is confirmed
  // and rejected if the dialog is denied.
  confirm: function(text) {
    return pie.promise.create(function(resolve, reject){
      if(window.confirm(text)) resolve();
      else reject();
    });
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
    var args = pie.array.from(arguments), path, notificationArgs, replaceState;

    /* Path is always first. */
    path = args.shift();


    /* Next we check for a query object */
    if(pie.object.isPlainObject(args[0])) {
      path = this.router.path(path, args.shift());

    /* If there is no query object we treat the first arg as an array and apply to router.path */
    /* This enables the user to pass anything to the router.path function by providing an array as the first arg */
    } else {
      path = this.router.path.apply(this.router, pie.array.from(path));
    }

    if(path === this.parsedUrl.get('fullPath')) return;

    /* If the next argument is a boolean, we care about replaceState */
    if(pie.object.isBoolean(args[0])) {
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

      this.softGo(path, replaceState);

      if(notificationArgs.length) {
        this.notifier.notify.apply(this.notifier, notificationArgs);
      }

    } else {

      if(notificationArgs.length) {
        this.storage.set(this.options.notificationStorageKey, notificationArgs);
      }

      this.hardGo(path);
    }
  },

  softGo: function(path, replaceState) {
    this.navigator.go(path, {}, replaceState);
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
    if(e.ctrlKey || e.metaKey || e.button > 0) return;

    // Extract the location from the link.
    var href = e.delegateTarget.getAttribute('href');

    // If we're going nowhere, somewhere else, or to an anchor on the page, let the browser take over
    if(!href || /^(#|[a-z]+:\/\/)/.test(href)) return;

    // Ensure that relative links are evaluated as relative
    if(href.charAt(0) === '?') href = this.parsedUrl.get('fullPath') + href;

    // Great, we can handle it. let the app decide whether to use pushstate or not
    e.preventDefault();
    this.go(href, !!e.delegateTarget.getAttribute('data-replace-state'));
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

  // When a link is clicked, go there without a refresh if we recognize the route.
  setupSinglePageLinks: function() {
    var target = pie.qs(this.options.navigationContainer || this.options.uiTarget);
    pie.dom.on(target, 'click', this.handleSinglePageLinkClick.bind(this), 'a[href]');
  },

  // Show any notification which have been preserved via local storage.
  showStoredNotifications: function() {
    var messages = this.storage.get(this.options.notificationStorageKey);

    if(messages && messages.length) {
      this.notifier.notify.apply(this.notifier, messages);
    }
  },

  // Start the app by starting the navigator (which we have observed).
  start: function() {
    this.emitter.fireSequence('start', this.navigator.start.bind(this.navigator));
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
}, pie.mixins.container);

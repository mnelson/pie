var Pie   = require('pie');
var Model = require('model');
var Arr   = require('extensions/array');
var Fn    = require('extensions/function');
var Obj   = require('extensions/object');

// # Pie Resources
//
// An external resource loader. It specializes in retrieving scripts, stylesheets, and generic ajax content.
// Upon load of the external resource a callback can be fired. Resources can be registered beforehand to make
// development a bit easier and more standardized.
// ```
// resources.define('googleMaps', '//maps.google.com/.../js');
// resources.define('templates', {src: '/my-templates.html', dataSuccess: parseTemplates});
//
// resources.load('googleMaps', 'templates', 'customI18n', function(){
//   google.Maps.doStuff();
// });
// ```
module.exports = Model.extend('resources', {

  // ** pie.resources.init **
  //
  // Provide an app and a source map (shortcut all the `resources.define()` calls).
  // ```
  // new pie.resources(app, {googleMaps: '//maps.google.com/.../js'});
  // ```
  init: function(app, srcMap) {
    this._super({
      srcMap: srcMap || {},
      loaded: {}
    }, {
      app: app
    });

    Obj.forEach(function(k,v) {
      this.define(k, v);
    }.bind(this));
  },

  _appendNode: function(node) {
    var target = Pie.qs('head');
    target = target || document.body;
    target.appendChild(node);
  },

  _inferredResourceType: function(src) {
    if((/(\.|\/)js(\?|$)/).test(src)) return 'script';
    if((/(\.|\/)css(\?|$)/).test(src)) return 'link';
    if((/\.(png|jpeg|jpg|gif|svg|tiff|tif)(\?|$)/).test(src)) return 'image';
    return 'ajax';
  },

  _normalizeSrc: function(srcOrOptions) {
    var options = typeof srcOrOptions === 'string' ? {src: srcOrOptions} : Obj.merge({}, srcOrOptions);
    return options;
  },

  // **pie.resources.\_loadajax**
  //
  // Conduct an ajax request and invoke the `resourceOnload` function when complete
  //
  // Options:
  // * **src** - the url of the request
  // * ** * ** - any valid ajax options
  _loadajax: function(options, resourceOnload) {
    var ajaxOptions = Obj.merge({
      verb: 'GET',
      url: options.src
    }, options);

    var request = this.app.ajax.ajax(ajaxOptions);
    request.success(resourceOnload);
  },

  // **pie.resources.\_loadimage**
  //
  // Load an image and invoke `resourceOnload` when complete.
  // Options:
  // * **src** - the url of the image.
  _loadimage: function(options, resourceOnload) {
    var img = new Image();
    img.onload = function(){
      resourceOnload(Obj.merge({
        img: img
      }, options));
    };
    img.src = options.src;
  },

  // **pie.resources.\_loadlink**
  //
  // Adds a `<link>` tag to the dom if the "type" of the resource is "link".
  //
  // Options:
  // * **src** - the url of the resource
  // * **media** - _(optional)_ defaulting to `screen`, it's the media attribute of the `<link>`
  // * **rel** - _(optional)_ defaulting to `stylesheet`, it's the rel attribute of the `<link>`
  // * **contentType** - _(optional)_ defaulting to `text/css`, it's the type attribute of the `<link>`
  //
  // _Note that since `<link>` tags don't provide a callback, the onload happens immediately._
  _loadlink: function(options, resourceOnload) {
    var link = document.createElement('link');

    link.href = options.src;
    link.media = options.media || 'screen';
    link.rel = options.rel || 'stylesheet';
    link.type = options.contentType || 'text/css';

    this._appendNode(link);

    /* Need to record that we added this thing. */
    /* The resource may not actually be present yet. */
    resourceOnload();
  },

  // **pie.resources.\_loadscript**
  //
  // Adds a `<script>` tag to the dom if the "type" is "script"
  //
  // Options:
  // * **src** - the url of the script.
  // * **callbackName** - _(optional)_ the global callback name the loading library will invoke
  // * **noAsync** - _(optional)_ if true, the script will be loaded synchronously.
  _loadscript: function(options, resourceOnload) {

    var script = document.createElement('script');

    if(options.noAsync) script.async = false;

    /* If options.callbackName is present, the invoking method self-references itself so it can clean itself up. */
    /* Because of this, we don't need to invoke the onload */
    if(!options.callbackName) {
      script.onload = resourceOnload;
    }

    this._appendNode(script);
    script.src = options.src;
  },

  // ** pie.resources.define **
  //
  // Define a resource by human readable `name`. `srcOrOptions` is a url or
  // an options hash as described by the relevant `_load` function.
  // ```
  // resources.define('googleMaps', '//maps.google.com/.../js');
  // ```
  define: function(name, srcOrOptions) {
    var options = this._normalizeSrc(srcOrOptions);
    this.set('srcMap.' + name, options);
  },

  // ** pie.resources.load **
  //
  // Load resources defined by each argument.
  // If the last argument is a function it will be invoked after all resources have loaded.
  // ```
  // resources.load('foo', 'bar', function callback(){});
  // resources.load(['foo', 'bar'], function(){});
  // resources.load('//maps.google.com/.../js');
  // resources.load({src: '/templates.html', dataSuccess: parseTemplates}, function callback(){});
  // ```
  load: function(/* src1, src2, src3, onload */) {
    var sources = Arr.change(arguments, 'from', 'flatten', 'compact'),
    onload = Obj.isFunction(Arr.last(sources)) ? sources.pop() : function(){},
    fns;

    sources = sources.map(this._normalizeSrc.bind(this));

    /* we generate a series of functions to be invoked by pie.fn.async */
    /* each function's responsibility is to invoke the provided callback when the resource is loaded */
    fns = sources.map(function(options){

      /* we could be dealing with an alias, so make sure to grab the real source */
      options = this.get('srcMap.' + options.src) || options;

      /* we cache the status of the resource in our `loaded` object. */
      var src = options.src,
      loadedKey = 'loaded.' + src;

      /* the pie.fn.async function */
      return function(cb) {
        var loadedVal = this.get(loadedKey);

        /* if the loadedKey's value is true, we've already loaded this resource */
        if(loadedVal === true) {
          cb();
          return true;
        }

        /* otherwise, if it's present, it's an array of callbacks to be invoked when the resource is loaded (fifo) */
        if(loadedVal) {
          loadedVal.push(cb);
          return false;
        }

        /* holy balls, this is the first time. set the array up */
        this.set(loadedKey, [cb]);

        /* determine the type of resource to be loaded */
        var type = options.type || this._inferredResourceType(options.src),

        /* upon load, we invoke all the registered callbacks for the resource */
        resourceOnload = function() {

          this.get(loadedKey).forEach(function(fn) { if(fn) fn(); });

          /* make sure we set the loadedKey to true so we know we don't have to do this again */
          this.set(loadedKey, true);

          /* if we set up a global callbackName we make sure it's removed */
          if(options.callbackName) delete window[options.callbackName];
        }.bind(this);

        /* if a global callback name is desired, set it to our onload handler */
        if(options.callbackName) {
          window[options.callbackName] = resourceOnload;
        }

        /* start the resource */
        this['_load' + type](options, resourceOnload);

        return false;
      }.bind(this);
    }.bind(this));

    /* now start loading all the resources */
    Fn.async(fns, onload);
  }
});

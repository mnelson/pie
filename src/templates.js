var Pie   = require('pie');
var Model = require('model');
var Obj   = require('extensions/object');
var Str   = require('extensions/string');

// # Pie Templates
// A container for a collection of templates. It knows how to read, compile, and invoke template functions.
// ```
// templates.registerTemplate('plainOld', "Just plain old string content: [%= data.id %]");
// templates.render('plainOld', {id: 'fooBar'});
// //=> "Just plain old string content: fooBar"
// ```
//
// Templates can be declared in two ways:
// 1. **script tag content** - tags matching the `templateSelector` class option can be given an id attribute which maps to the templates name.
// If a template by that name is requested and has not yet been compiled, the tag's content will be parsed and a template function will be generated.
// 2. **script tag data-src** - The same process as `1.` is followed but if a `data-src` attribute is present a `text/html` ajax request will take place to fetch the template content.
// After fetch, the content will be parsed and a template will be generated. This method is inherently async and is only checked if `templates#renderAsync` is used.
module.exports = Model.extend('templates', {

  init: function(app, options) {
    this._super({}, Obj.merge({
      app: app,
      templateSelector: 'script[type="text/pie-template"]'
    }, options));
  },

  _node: function(name) {
    return Pie.qs(this.options.templateSelector + '[id="' + name + '"]');
  },

  // **pie.templates.registerTemplate**
  //
  // Register a template containing the `content` by the `name`.
  // The resulting function will be one produced by `pie.string.template` but will
  // have any registered helpers available via the `pie.helpers` `variableName` option.
  //
  // So the following template would function fine, given the default helper methods as defined by `pie.helpers`
  // ```
  // <h1>[%= h.t("account.hello") %], [%= h.get(data, "firstName") %]</h1>
  // ```
  registerTemplate: function(name, content) {
    var args = Pie._debugArgs('Compiling template: %c' + name);
    args.push("color: #aaa;");

    this.app.debug.apply(this.app, args);

    this.set(name, Str.template(content, this.app.helpers.provideVariables()));
  },

  // **pie.templates.load**
  //
  // Load a template from an external source, register it, then invoke the callback.
  // ```
  // templates.load('fooBar', {url: '/foo-bar.html'}, function(){
  //   template.render('fooBar', {});
  // });
  // ```
  load: function(name, ajaxOptions, cb) {
    ajaxOptions = Obj.merge({
      verb: 'get',
      accept: 'text/html'
    }, ajaxOptions);

    var req = this.app.ajax.ajax(ajaxOptions);

    req.dataSuccess(function(content) {
      this.registerTemplate(name, content);
    }.bind(this)).error(function(){
      throw new Error("[PIE] Template fetch error: " + name);
    }).complete(function() {
      cb();
    });

  },

  // **pie.templates.render**
  //
  // Synchronously render a template named `name` with `data`.
  // This will compile and register a template if it's never been seen before.
  // ```
  // <script id="fooBar" type="text/pie-template">
  //   Hi, [%= data.name %]
  // </script>
  // <script>
  //   templates.render('fooBar', {name: 'Doug'});
  //   //=> "Hi, Doug"
  // </script>
  // ```
  render: function(name, data) {
    if(!this.get(name)) {

      var node = this._node(name);

      if(node) {
        this.registerTemplate(name, node.content || node.textContent);
      } else {
        throw new Error("[PIE] Unknown template error: " + name);
      }
    }

    return this.get(name)(data || {});
  },

  // **pie.templates.renderAsync**
  //
  // Render a template asynchronously. That is, attempt to extract the content from the associated `<script>` but
  // if it declares a `data-src` attribute, fetch the content from there instead. When the template is available
  // and rendered, invoke the callback `cb` with the content.
  // ```
  // <script id="fooBar" type="text/pie-template" data-src="/foo-bar.html"></script>
  // <script>
  //   templates.renderAsync('fooBar', {name: 'Doug'}, function(content){
  //     //=> "Hi, Doug"
  //   });
  // </script>
  // ```
  renderAsync: function(name, data, cb) {

    var content, node, src;

    if(this.get(name)) {
      content = this.render(name, data);
      cb(content);
      return;
    }

    node = this._node(name);
    src = node && node.getAttribute('data-src');

    if(src) {
      this.load(name, {url: src}, function(){
        this.renderAsync(name, data, cb);
      }.bind(this));
    } else {
      content = this.render(name, data);
      cb(content);
      return;
    }
  },
});

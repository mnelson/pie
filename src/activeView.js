// a view class which handles some basic functionality
pie.activeView = function activeView(options) {
  pie.view.call(this, options);
};

pie.inherit(pie.activeView, pie.view);

pie.activeView.prototype.addedToParent = function(parent) {
  pie.view.prototype.addedToParent.call(this, parent);

  if(this.options.autoRender && this.model) {
    var field = typeof this.options.autoRender === 'string' ? this.options.autoRender : 'updated_at';
    this.onChange(this.model, this.render.bind(this), field);
  }

  if(this.options.renderOnAddedToParent) {
    this.render();
  }

  return this;
};

// add or remove the default loading style.
pie.activeView.prototype.loadingStyle = function(bool) {
  if(bool === undefined) bool = true;
  this._loadingStyle(bool);
};

// If the first option passed is a node, it will use that as the query scope.
// Return an object representing the values of fields within this.el.
pie.activeView.prototype.parseFields = function() {
  var o = {}, e = arguments[0], i = 0, n, el;

  if('string' === typeof e) {
    e = this.el;
  } else {
    i++;
  }

  for(;i<arguments.length;i++) {
    n = arguments[i];
    el = e.querySelector('[name="' + n + '"]:not([disabled])');
    if(el) pie.object.setPath(o, n, el.value);
  }
  return o;
};

pie.activeView.prototype.removedFromParent = function(parent) {
  pie.view.prototype.removedFromParent.call(this, parent);

  // remove our el if we still have a parent node.
  // don't use pie.dom.remove since we don't want to remove the cache.
  if(this.el.parentNode) this.el.parentNode.removeChild(this.el);
};


// convenience method which is useful for ajax callbacks.
pie.activeView.prototype.removeLoadingStyle = function(){
  this._loadingStyle(false);
};


pie.activeView.prototype.renderData = function() {
  if(this.model) {
    return this.model.data;
  }

  return {};
};

pie.activeView.prototype.render = function() {

  if(this.options.template) {
    var content = this.app.template(this.options.template, this.renderData());
    this.el.innerHTML = content;
  }

  return this;
};


// this.el receives a loading class, specific buttons are disabled and provided with the btn-loading class.
pie.activeView.prototype._loadingStyle = function(bool) {
  this.el.classList[bool ? 'add' : 'remove']('loading');

  var buttons = this.qsa('.submit-container button.btn-primary, .btn-loading, .btn-loadable');

  pie.dom.all(buttons, bool ? 'classList.add' : 'classList.remove', 'btn-loading');
  pie.dom.all(buttons, bool ? 'setAttribute' : 'removeAttribute', 'disabled', 'disabled');
};


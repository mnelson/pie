// a view class which handles some lightbox functionality
pie.lightboxView = pie.activeView.extend('lightboxView', {
  init: function(options) {
    options.el = this.container(options.klasses);
    delete options.klasses;
    this._super(options);
  },

  setup: function() {
    this.emitter.on('afterRender', this.bindEvents.bind(this));
    this._super();
  },

  _appendToDom: function() {
    if(this.el.parentNode) return;
    document.querySelector('body').appendChild(this.el);
  },

  _renderTemplateToDom: function() {
    var templateName = this.templateName();
    if(templateName) {
      var content = this.app.templates.render(templateName, this.renderData());
      this.qs('.lightbox-content').innerHTML = content;
    }
  },

  container: function(klasses) {
    var outer = pie.dom.createElement('<div />'),
        inner = pie.dom.createElement('<div />');

    outer.classList.add('lightbox-container');
    klasses = klasses || [];
    klasses.push('lightbox-content');
    inner.classList.add.apply(inner.classList, klasses);
    outer.appendChild(inner);
    return outer;
  },

  bindEvents: function() {
    this.on('click', null, this.removeSelf.bind(this));
  },

  removeSelf: function(e) {
    if(!e.target.classList.contains('lightbox-container')) return;
    this.removeFromParent();
  }
});
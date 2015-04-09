pie.mixins.listView = {
  init: function() {
    this._super.apply(this, arguments);
    this.options.item = this.options.item || {};
    this._ensureList();
    this._ensureTemplate();
  },

  /* we build a list if one isn't present already */
  _ensureList: function() {
    this.list = this.list || this.options.list || new pie.list([]);
  },

  _ensureTemplate: function() {
    if (this.options.template) return;

    // TODO how is this gonna work
    var name = 'listViewTemplate',
      content = "<ul class='js-items-container'></ul>";

    this.app.templates.registerTemplate(name, content);
    this.options.item.uiTarget = '.js-items-container';
    this.options.template = name;
  },

  setup: function() {
    this.onChange(this.list, this._renderItemsToEl.bind(this), '_version');
    this.emitter.waitUntil('afterRender', 'afterAttach', this._renderItemsToEl.bind(this));

    this._super.apply(this, arguments);
  },

  _renderItemsToEl: function(templateName) {
    var container = this.qs(this.options.item.uiTarget),
      content;

    // TODO this should be a transition
    container.classList.add('is-loading');
    this._removeItems();
    this._addItems();
    container.classList.remove('is-loading');
  },

  _addItems: function() {
    var items = this.renderData(),
      klass = this.options.item.klass || this._defaultItemKlass();

    items.forEach(function(data, i) {
      this.addChild('item-' + i, new klass(data));
    }.bind(this));
  },

  _removeItems: function() {
    var regex = new RegExp('item');

    if(this.children.length) {
      Object.keys(this.childNames).forEach(function(k) {
        if(!regex.test(k)) return;
        var child = this.getChild(k);
        this.removeChild(k);
        child.teardown();
      }.bind(this))
    }
  },

  _defaultItemKlass: function() {
    var tmpl = this.options.item.template,
      uiTarget = this.qs(this.options.item.uiTarget);

    return pie.activeView.extend('listItemView', function(data) {
      this.model = new pie.model(data);

      this._super({
        renderOnSetup: true,
        setup: true,
        template: tmpl,
        uiTarget: uiTarget
      });
    });
  },

  renderData: function() {
    if (this.list) {
      return this.list.get('items') || [];
    }

    return [];
  }

};
// # Pie ListView
//
// A view mixin for easily managing a series of items. It assumes the activeView mixin has already been applied to your view.
// ```
// UserList = pie.view.extend(pie.mixins.activeView, pie.mixins.listView);
// list = new UserList({
//   template: 'userList',
//   list: {
//     containerSel: 'ul.js-user-list'
//   },
//   item: {
//     templateName: 'userItem'
//   }
// });
// ```
pie.mixins.listView = (function(){

  var _listItemClass;
  var listItemClass = function(){
    return _listItemClass = _listItemClass || pie.view.extend('defaultListItemView', pie.mixins.activeView);
  };
  return {

    init: function() {

      this._super.apply(this, arguments);

      this.options = pie.object.deepMerge({
        listOptions: {
          containerSel: 'ul, ol, .js-items-container',
          loadingClass: 'is-loading',
          modelAttribute: 'items'
        },
        itemOptions: {
          viewClass: null,
          template: null
        }
      }, this.options);

      if(!this.options.itemOptions.viewClass && !this.options.itemOptions.template) {
        throw new Error("No viewClass or template provided for the itemOptions");
      }

      this.list = this.list || new pie.list([]);
    },

    setup: function() {
      this.onChange(this.list, this.renderItems.bind(this), this.options.listOptions.modelAttribute);
      this.emitter.on('afterRender', this.renderItems.bind(this));

      this._super.apply(this, arguments);
    },

    addItems: function() {
      var container = this.qs(this.options.listOptions.containerSel),
        opts = pie.object.dup(this.options.itemOptions),
        klass = opts.viewClass || listItemClass(),
        afterRenders = [],
        child;

      delete opts.viewClass;

      this.listData().forEach(function(data, i) {
        child = new klass(opts, data);

        // we subscribe to each child's after render to understand when our "loading" style can be removed.
        afterRenders.push(function(cb) {
          child.emitter.once('afterRender', cb, {immediate: true});
        });

        this.addChild('list-item-' + i, child);

        // we append to the dom before setup to preserve ordering.
        child.appendToDom(container);
        child.setup();

      }.bind(this));

      pie.fn.async(afterRenders, this.setListLoadingStyle.bind(this));
    },

    removeItems: function() {
      var regex = /^list\-item\-/, child;

      pie.array.grep(Object.keys(this.childNames), regex).forEach(function(name) {
        child = this.getChild(name);
        this.removeChild(child);
        child.teardown();
      }.bind(this));
    },

    renderItems: function(templateName) {
      this.setListLoadingStyle(true);
      this.removeItems();
      this.addItems();
    },

    setListLoadingStyle: function(bool) {
      var className = this.options.listOptions.loadingClass;
      if(!className) return;

      var container = this.qs(this.options.listOptions.containerSel);
      container.classList[bool ? 'add' : 'remove'](className);
    },

    listData: function() {
      return this.list.get(this.options.listOptions.modelAttribute) || [];
    }

  };
})();

/* global bindings */
window.app = new pie.app({
  uiTarget: '#main'
});

app.router.map({
  '/examples/list-view.html' : {view: 'layout'}
});

pie.ns('lib.views')

lib.views.layout = pie.listView.extend('layout', {
  init: function() {
    this.list = new pie.list(this.listItems);

    this._super({
      item: {
        template: 'item',
      },
      renderOnSetup: true
    });
  },

  setup: function() {
    this.emitter.waitUntil('afterRender', 'afterAttach', this.injectShuffleButton.bind(this));
    this._super.apply(this, arguments);
  },

  injectShuffleButton: function() {
    this.el.insertAdjacentHTML('beforeEnd', '<button class="js-shuffle">Shuffle Items</button>');
    this.on('click', '.js-shuffle', this.shuffleItems.bind(this));
  },

  shuffleItems: function() {
    var items = this.listItems.sort(function() {
      return .5 - Math.random();
    });

    this.list.set('items', items);
  },


  listItems: [{
    title: 'Item 1',
  }, {
    title: 'Item 2',
  }, {
    title: 'Item 3',
  }, {
    title: 'Item 4',
  }, {
    title: 'Item 5',
  }, {
    title: 'Item 6',
  }]

});
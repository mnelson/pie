/*global example */

window.app = new pie.app({
  uiTarget: '#main',
  viewNamespace: 'example.views'
});

// Translations

app.i18n.load({
  keywords: {
    item: {
      singular: "item",
      plural: "items"
    }
  },
  list: {
    total: {
      zero: "No ${keywords.item.plural} have been added",
      one: "1 ${keywords.item.singular}",
      other: "%{count} ${keywords.item.plural}"
    },
    completed: "%{count} completed."
  }
});

// Routes
app.router.map({
  '/examples/todo.html' : { view: 'layout' }
});


// VIEWS

// our custom namespace;
window.example = {
  views: {}
};

// the page level view.
// this view handles managing it's children, initializes page context via the pie.list.
example.views.layout = pie.activeView.extend('layout', {

  init: function() {

    // this is our page "context". It represents a list of items.
    this.list = new pie.list([]);

    pie.object.merge(this.list, pie.mixins.validatable);

    this.list.validates({
      nextItem: {presence: {message: "You can't submit a blank item!"}}
    });


    this._super({

      // this is the template this view renders.
      template: 'layoutContainer',

      // since we don't need to retrieve anything from a web service, we can render immediately.
      renderOnSetup: true
    });
  },

  setup: function() {
    this.emitter.on('afterRender', this.renderChildren.bind(this));
    this._super();
  },

  renderChildren: function() {
    // ensure we don't have any children (rerender)
    this.teardownChildren();
    this.removeChildren();

    var child;

    // add our form view which will handle the addition of data.
    // addChild sets up the child view and relates it to this view (the parent).
    child = new example.views.form(this.list);

    // when the child finishes rendering, it will add itself to the dom
    this.addChild('form', child);
    child.setup();
    // we still haven't added it to the dom yet, though. So we choose where to put it.
    child.appendToDom(this.qs('.form-container'));

    // add our list view.
    child = new example.views.list(this.list);
    this.addChild('list', child);
    child.setup();
    child.appendToDom(this.qs('.list-container'));
  }
});

// this view handles taking in user input to modify the list model.
// notice the model is provided to the form explicity. This isn't necessary, but is generally a good idea.
example.views.form = pie.activeView.extend({
  init: function(listModel) {

    // this.model is special in that the default renderData() implementation checks for this.
    this.list = this.model = listModel;

    this._super({
      template: 'formContainer',
      renderOnSetup: true
    });
  },

  // we override init to set up events.
  setup: function() {
    // first, we setup our bound attributes.
    // this simple form of the bind is equivalent to:
    // this.bind({
    //   model: this.model,
    //   attr: 'nextItem',
    //   sel: 'input[name="nextItem"]',
    //   trigger: 'keyup change',
    //   debounce: false
    // })
    this.bind({attr: 'nextItem'});

    // we observe the form submission and invoke handleSubmission when it occurs.
    this.on('submit', 'form', this.handleSubmission.bind(this));

    // any time the input changes, we force validation, which we observe below.
    this.on('keyup', 'input', this.validate.bind(this));

    // observe changes to our validation
    this.observe(this.list, 'validationChanged', 'validationErrors.nextItem');
    this._super();
  },

  // handle our form submission.
  handleSubmission: function(e) {
    // don't really submit it...
    e.preventDefault();

    this.list.validateAll.then(function(bool) {
      // insert the item at the beginning.
      var newItem = new pie.model({title: this.list.get('nextItem'), completed: false});
      this.list.push(newItem);

      // remove the nextItem attribute, updating the UI.
      this.list.set('nextItem', '');
    }.bind(this));
  },

  // when the validation changes, determine the correct bg color.
  validationChanged: function(changes) {
    var change = pie.array.last(changes),
    el = this.qs('input');
    if(change.value && change.value.length) {
      el.style.backgroundColor = 'rgba(255,0,0,0.2)';
    } else {
      el.style.backgroundColor = 'inherit';
    }
  },

  // validate the nextItem of the list.
  validate: function() {
    this.list.validate('nextItem');
  }

}, pie.mixins.bindings);


// this view handles rendering the list and dealing with removals.
example.views.list = pie.activeView.extend({
  init: function(listModel) {

    // this.model is needed for autoRender
    // if you didn't use autoRender you would have to add
    // this.observe(this.list, 'render', 'items') in init.
    this.list = this.model = listModel;

    // this time we use autoRender to automatically render this view
    // any time the "items" attribute of the model changes.
    this._super({
      template: 'listContainer',
      renderOnSetup: true
    });
  },

  // set up our events, then invoke super.
  setup: function() {
    this.on('click', '.js-complete-all', 'completeAll');
    this.observe(this.list, 'listChanged');
    this.eon('afterRender', 'updateSummary');
    this._super();
  },

  completeAll: function(e) {
    e.preventDefault();

    this.list.forEach(function(item){
      item.set('completed', 1);
    });
  },

  itemAdded: function(change) {
    var sibling = change.oldValue && this.getChild('view-' + pie.uid(change.oldValue)),
    child = new example.views.item(this.list, change.value);

    this.addChild('view-' + pie.uid(change.value), child);
    child.setup();

    if(sibling) {
      sibling.el.parentNode.insertBefore(child.el, sibling.el);
    } else {
      this.qs('ul').appendChild(child.el);
    }
  },

  itemCompleted: function() {
    this.updateSummary();
  },

  itemRemoved: function(change) {
    var child = this.getChild('view-' + pie.uid(change.oldValue));
    this.removeChild(child);
    child.teardown();
  },

  listChanged: function(changes) {
    changes.forEach(function(change){

      if(change.name === 'length') {
        this.updateSummary();
      } else if(!isNaN(parseInt(change.name, 10))) {
        if(change.type === 'add') {
          this.itemAdded(change);
        } else if (change.type === 'delete') {
          this.itemRemoved(change);
        }
      }

    }.bind(this));
  },

  updateSummary: function() {
    var l = this.list.length(),
    total = this.app.i18n.t('list.total', {count: l}),
    completed = l && this.app.i18n.t('list.completed', {count: this.qsa('input[name="completed"]:checked').length});

    this.qs('#summary').innerHTML = pie.array.compact([total, completed], true).join(', ');
    this.qs('.js-complete-all').style.display = l ? 'block' : 'none';
  }
});

// this view handles rendering an individual item
example.views.item = pie.activeView.extend('item', {
  init: function(listModel, itemModel) {

    this.list = listModel;
    this.item = this.model = itemModel;

    // this time we use autoRender to automatically render this view
    // any time the "items" attribute of the model changes.
    this._super({
      template: 'itemContainer',
      renderOnSetup: true
    });
  },

  // set up our events, then invoke super.
  setup: function() {
    this.bind({attr: 'completed'});

    this.observe(this.item, 'completedChanged', 'completed');

    // any time a js-delete link is clicked, invoke deleteItem.
    this.on('click', '.js-delete', this.deleteItem.bind(this));
    this._super();
  },

  completedChanged: function() {
    this.bubble('itemCompleted', this.item);
  },

  deleteItem: function(e) {
    // don't follow the link.
    e.preventDefault();

    // grab the index from the data- attribute.
    var index = this.list.indexOf(this.item);

    // remove the item from the list.
    this.list.remove(index);
  }
}, pie.mixins.bindings);

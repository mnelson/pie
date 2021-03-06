/* global bindings */
window.app = pie.app.create({
  routeHandlerOptions: {
    viewNamespace: 'forms'
  }
});


app.router.map({
  '/examples/form-views.html' : {view: 'layout'}
});



pie.ns('forms').layout = pie.formView.extend('layout', {

  debugName: 'view',

  init: function() {

    this._super({
      refs: {
        json: 'textarea[name="json"]',
        submission: 'textarea[name="submission"]'
      },
      template: 'layout',
      validationStrategy: 'validate',
      fields: [
        {
          name: 'first_name',
          binding: {
            debounce: true
          }
        }, {
          name: 'last_name'
        }, {
          name: 'email',
          validation: {
            email: true
          }
        }, {
          name: 'password',
          validation: {
            length: {
              gte: 6
            }
          }
        }, {
          name: 'interests',
          binding: {
            dataType: 'array'
          },
          validation: {
            chosen: true
          }
        }, {
          name: 'tos',
          binding: {
            dataType: 'boolean'
          },
          validation: {
            presence: {messageKey: 'chosen'}
          }
        }, {
          name: 'mailing_list',
          binding: {
            dataType: 'boolean'
          },
          validation: {
            chosen: true
          }
        }
      ]
    });

    this.model.compute('fullName', function(){
      return pie.array.compact([this.get('first_name'), this.get('last_name')]).join(" ") || 'Unknown';
    }, 'first_name', 'last_name');

  },

  setup: function() {
    this.observe(this.model, 'modelChanged');
    this.eonce('afterSetup', 'modelChanged');

    this.bind({
      attr: 'title'
    });

    this.bind({
      attr: 'title',
      type: 'attribute',
      sel: '.title',
      toModel: false,
      options: {
        attribute: 'style'
      }
    });

    this.bind({
      attr: 'title',
      type: 'class',
      sel: '.title',
      toModel: false,
      options: {
        className: '_value_'
      }
    });

    this.bind({
      attr: 'fullName',
      type: 'text',
      sel: '.full-name',
      toModel: false
    });

    this._super();
  },

  modelChanged: function() {
    var str = JSON.stringify(this.model.data, null, '  ');
    this.dom.json.value = str;
    this.dom.submission.value = '';
  },

  // By default, this will conduct an ajax request with the "ajax" options provided in the constructor.
  // Since we're just showing an example, we're just outputting the submission data on the page.
  performSubmit: function(d) {
    var str = JSON.stringify(d, null, '  ');
    this.dom.submission.value = str;
    return pie.promise.resolve();
  }

});

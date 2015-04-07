var Obj = require('./../extensions/object');

module.exports = {

  setup: function() {

    if(this.options.autoRender && this.model) {
      var field = Obj.isString(this.options.autoRender) ? this.options.autoRender : '_version';
      this.onChange(this.model, this.render.bind(this), field);
    }

    if(this.options.renderOnSetup) {
      this.emitter.once('setup', this.render.bind(this));
    }

    this.emitter.on('render', this._renderTemplateToEl.bind(this));

    this._super();
  },

  _renderTemplateToEl: function() {
    var templateName = this.templateName();

    if(templateName) {
      this.app.templates.renderAsync(templateName, this.renderData(), function(content){
        this.el.innerHTML = content;
        this.emitter.fire('afterRender');
      }.bind(this));
    } else {
      this.emitter.fire('afterRender');
    }
  },

  renderData: function() {
    if(this.model) {
      return this.model.data;
    }

    return {};
  },

  render: function() {
    this.emitter.fire('beforeRender');
    this.emitter.fireAround('aroundRender', function(){
      // afterRender should be fired by the render implementation.
      // There's the possibility that a template needs to be fetched from a remote source.
      this.emitter.fire('render');
    }.bind(this));
  },

  templateName: function() {
    return this.options.template;
  }

};

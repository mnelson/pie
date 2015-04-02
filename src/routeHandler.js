pie.routeHandler = pie.base.extend('routeHandler', {

  init: function(app, options) {
    this.app = app;
    this.options = pie.object.merge({
      viewNamespace: 'lib.views',
      uiTarget: 'body',
      viewKey: 'view',
      viewTransitionClass: pie.simpleViewTransition,
      viewTransitionOptions: {}
    }, options);

    this._super();

    this.urlModel = this.app.parsedUrl;
    this.emitter  = this.app.emitter;
  },

  currentView: function() {
    return app.getChild("currentView");
  },

  handle: function() {
    return this.handleRedirect() || this.handleView();
  },

  handleRedirect: function() {
    var redirectTo = this.urlModel.get('redirect');
    if(redirectTo) {
      this.app.go(redirectTo);
      return true;
    } else {
      return false;
    }
  },

  handleView: function() {
    var current = this.currentView();

    // if the view that's in there is already loaded, don't remove / add again.
    if(current && current._pieName === this.urlModel.get(this.options.viewKey)) {
      this.emitter.fire('navigationUpdated', this);
      if(pie.object.has(current, 'navigationUpdated', true)) current.navigationUpdated();
      return true;
    }

    this.transitionToNewView();
    return true;
  },

  // The process for transitioning to a new view.
  // Both the current view and the next view are optional.
  transitionToNewView: function() {
    var current = this.currentView(),
        target, viewClass, child, transition;

    target = pie.qs(this.options.uiTarget);

    // Provide some events that can be observed around the transition process.
    this.emitter.fire('beforeViewChanged', this);
    this.emitter.fireAround('aroundViewChanged', function() {

      this.emitter.fire('viewChanged', this);

      // Use the view key of the urlModel to find the viewClass.
      // At this point we've already verified the view option exists, so we don't have to check it.
      viewClass = pie.object.getPath(window, this.options.viewNamespace + '.' + this.urlModel.get(this.options.viewKey));

      // The instance to be added. If the class is not defined, this could and should blow up.
      child = new viewClass({ app: this.app });

      // Cache an identifier on the view so we can invoke navigationUpdated instead of reloading
      // if the url changes but the view does not
      child._pieName = this.urlModel.get(this.options.viewKey);

      // Instantiate a transition object based on the app configuration.
      transition = new this.options.viewTransitionClass(this.app, pie.object.merge({
        oldChild: current,
        newChild: child,
        childName: "currentView",
        targetEl: target
      }, this.options.viewTransitionOptions));

      // Provide a couple common events out of the app.
      transition.emitter.on('afterRemoveOldChild', function() {
        this.emitter.fire('oldViewRemoved', current);
      }.bind(this));

      transition.emitter.on('afterTransition', function() {
        this.emitter.fire('newViewLoaded', child);
      }.bind(this));

      transition.transition(function(){
        // The instance is now our 'currentView'
        this.emitter.fire('afterViewChanged', this);
      }.bind(this));

    }.bind(this));
  },
});

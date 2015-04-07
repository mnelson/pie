// activeView has moved to a mixin, you should use the mixin rather than this class.
// This class is being preserved for the sake of backwards compatability.
var View        = require('view');
var ActiveView  = require('mixins/activeView');

module.exports = View.extend('activeView', ActiveView);

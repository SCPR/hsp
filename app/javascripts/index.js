'use strict';
window.jQuery = require('jquery');
window.$      = jQuery;
require('./header');
require('./player');
require('./feedback');
require('./geocomplete');
require('./lookup')('#page-form');
require('./lookup')('#draw-form');
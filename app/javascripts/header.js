'use strict';

const $        = require('jquery');
const OnScreen = require('onscreen');

let os = new OnScreen({
  tolerance: 0,
  debounce: 100,
  container: window
});

os.on('enter', 'header[top]', () => {
  $('header[fixed]').removeClass('active');
});

os.on('leave', 'header[top]', () => {
  $('header[fixed]').addClass('active');
})
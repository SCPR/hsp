'use strict';

const OnScreen = require('onscreen');

let os = new OnScreen({
  tolerance: 0,
  debounce: 100,
  container: 'main'
});

let headerFixed = $('header[fixed]');

os.on('enter', 'header[top]', () => {
  headerFixed.removeClass('active');
});

os.on('leave', 'header[top]', () => {
  headerFixed.addClass('active');
});

if($(document).scrollTop() > $('header[top]').height()){
  headerFixed.addClass('active');
}

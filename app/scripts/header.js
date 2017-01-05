'use strict';

const OnScreen = require('onscreen');

let os = new OnScreen({
  tolerance: 0,
  debounce: 100,
  container: 'main'
});

let hero        = $('.hero').first();
let headerFixed = $('header[fixed]');
let tagline     = headerFixed.find('span[tagline]');
let main        = $('main');
// os.on('enter', '#headline-sm-breakpoint', () => {
//   tagline.removeClass('active');
// });

// os.on('leave', '#headline-sm-breakpoint', () => {
//   tagline.addClass('active');
// });

if(main.scrollTop() > hero.height()){
  tagline.addClass('active');
}

main.on('scroll', (e) => {
  if(main.scrollTop() > hero.height()) {
    tagline.addClass('active');
  } else {
    tagline.removeClass('active');
  }
});
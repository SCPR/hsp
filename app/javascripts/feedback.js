'use strict';

const $           = require('jquery');
const feedback    = $('aside[feedback]');
const shadow      = $('[feedback-shadow]');
const topBound    = $('[top-bound]');
const bottomBound = $('[bottom-bound]');

let height = shadow.outerHeight();

let adjust = (e) => {
  let top    = shadow.offset().top;
  let bottom = top + height;
  let above  = topBound.offset().top + topBound.outerHeight();
  let below  = bottomBound.offset().top;
  if((above > top)){
    feedback.css('position', 'absolute')
    feedback.css('top', `${above + height}px`)
  } else if((below < bottom)){
    feedback.css('position', 'absolute')
    feedback.css('top', `${below - height}px`);
  } else {
    feedback.css('position', '');
    feedback.css('top', '');
  }
}

$(window).on('scroll resize', adjust);
adjust();
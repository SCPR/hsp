'use strict';

const feedback    = $('aside[feedback]');
const shadow      = $('[feedback-shadow]');
const topBound    = $('[top-bound]');
const bottomBound = $('[bottom-bound]');

let height = feedback.outerHeight();

let isVisible = false;

let adjust = (e) => {
  let top    = feedback.offset().top; // top of element
  let bottom = top + height; // bottom of element
  let above  = topBound.offset().top + topBound.outerHeight(); // top-bound
  let below  = bottomBound.offset().top; // bottom-bound

  if((above < 1) && (below > 1)){
    if(!isVisible){
      isVisible = true;
      feedback.addClass('visible');
    }
  } else {
    if(isVisible){
      isVisible = false;
      feedback.removeClass('visible');
    }
  }
}

$(window).on('scroll resize', adjust);
$('main').on('scroll', adjust);
adjust();
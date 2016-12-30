'use strict';

const Clipboard = require('clipboard');

let fallbackMessage = (action) => {
  let actionMsg = '';
  let actionKey = action === 'cut' ? 'X' : 'C';
  if (/iPhone|iPad/i.test(navigator.userAgent)) {
    actionMsg = 'Action not supported.';
  } else if (/Mac/i.test(navigator.userAgent)) {
    actionMsg = `Press ⌘-${actionKey} to ${action}`;
  } else {
    actionMsg = `Press Ctrl-${actionKey} to ${action}`;
  }
  return actionMsg;
};

$('button[copy]').on('mouseleave', (e) => {
  let el = $(e.currentTarget);
  if(el.attr('aria-label')){
    el.one('transitionend', (e) => {
      el.removeAttr('aria-label');
    });
  }
});

let clipboard = new Clipboard('button[copy]');

clipboard.on('success', (e) => {
  e.clearSelection();
  $(e.trigger).attr('aria-label', 'Copied to clipboard.');
});

clipboard.on('error', (e) => {
  e.clearSelection();
  $(e.trigger).attr('aria-label', fallbackMessage());
});
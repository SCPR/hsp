'use strict';

const jQuery   = require('jquery');
const $        = jQuery;
const fs       = require('fs');

eval(fs.readFileSync("./node_modules/jplayer/dist/jplayer/jquery.jplayer.js", 'utf8'));
// ^^ This is kind of unfortunate.  We should look into replacing jPlayer in the future,
//    not only because of its jQuery dependency and it's lack of a module export, but
//    it's also becoming less maintained.

$("#jquery_jplayer_1").jPlayer({
  cssSelectorAncestor: "#jp_container_1",
  supplied: "mp3",
  autoBlur: false,
  smoothPlayBar: true,
  keyEnabled: true,
  remainingDuration: false,
  toggleDuration: true
});

$(".volume button").click( function() {
  $(this).addClass("hidden");
  $(this).siblings().removeClass("hidden");
});

$(".jp-stop").click( function() {
  $(".jp-audio").removeClass("now-playing");
});

$("aside[audio]").click(function() {
  $("#jquery_jplayer_1").jPlayer("setMedia", {
    title: $(this).attr('data-title'),
    mp3: $(this).attr('data-src')
  });
  $('.jp-audio-download').attr('href', $(this).attr('data-src'));
  $('.jp-audio-download').attr('download', $(this).attr('data-src').match(/[^\\/]+$/)[0]);
  $(this).addClass("now-playing");
  $(".jp-audio").addClass("now-playing");
  $("#jquery_jplayer_1").jPlayer("play");
});

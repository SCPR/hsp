'use strict';

const jQuery    = require('jquery');
const $         = jQuery;
const _         = require('underscore')._;
const Wherewolf = require('wherewolf');

var fn = fn || {};

$(document).ready(function(){
    fn._init();
});

var fn = {

    _s3url: "https://s3-us-west-1.amazonaws.com/scpr-projects/state_rep_boundaries/",

    _data: {},

    _init: function(){
        fn._data.wherewolf = {};
        fn._data.wherewolf.lac = Wherewolf();
        fn._data.wherewolf.sen = Wherewolf();
        fn._data.wherewolf.asem = Wherewolf();
        fn._events();
        fn._loaddata();
    },

    _events: function(){

        // trigger to address search
        $("input[id='addressSearch']").focus(function(event){
            fn._searchme();
        });

        // trigger to find users location
        $("button#findme").click(function(event){
            event.preventDefault();
            $(".data-loading").removeClass("hidden");
            fn._findme();
        });

        // trigger to submit users address
        $("button#submit").click(function(event){
            event.preventDefault();
            $(".data-loading").removeClass("hidden");
            fn._navigate();
        });

    },

    _loaddata: function(){
        $.getJSON(fn._s3url + "la-county-board-of-supervisors-districts-2011.json", function(data){
            fn._data.wherewolf.lac.addAll(data);
        });
        $.getJSON(fn._s3url + "state-senate-districts-2011.json", function(data){
            fn._data.wherewolf.sen.addAll(data);
        });
        $.getJSON(fn._s3url + "state-assembly-districts-2011.json", function(data){
            fn._data.wherewolf.asem.addAll(data);
        });
    },

    _searchme: function(){
        $("button#submit").css("font-weight", "700");
        $("button#_findme").css("font-weight", "100");
        $("input[id='addressSearch']").val("");
        $("input[id='latitudeSearch']").val("");
        $("input[id='longitudeSearch']").val("");
        $("#output").empty();
        $("input[id='addressSearch']").geocomplete({
            details: "form"
        });
    },

    _findme: function(){
        $("button#submit").css("font-weight", "100");
        $("button#_findme").css("font-weight", "700");
        $("input[id='addressSearch']").val("");
        $("input[id='latitudeSearch']").val("");
        $("input[id='longitudeSearch']").val("");
        $("#output").empty();
        var location_options = {
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 10000
        };
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                fn.locationSuccess,
                fn.locationError,
                location_options
            );
        } else {
            fn.displayAlert(
                "red",
                "Sorry",
                "Your browser lacks geolocation capabilities."
            );
        };
    },

    locationSuccess: function(position){
        $("input[id='latitudeSearch']").val(position.coords.latitude);
        $("input[id='longitudeSearch']").val(position.coords.longitude);
        $("button#submit").trigger("click");
    },

    locationError: function(error){
        if (error.code === 1){
            fn.displayAlert(
                "red",
                "Sorry. " + error.message,
                "The user denied use of location services or your privacy settings do not allow this application to determine your current location."
            );
        } else if (error.code === 2){
            fn.displayAlert(
                "#388B90",
                "Sorry. " + error.message,
                "We could not find your location."
            );
        } else if (error.code === 3){
            fn.displayAlert(
                "#388B90",
                "Sorry. " + error.message,
                "An attempt to locate your position timed out. Please refresh the page and try again."
            );
        };
    },

    _navigate: function(){
        if ($("#output").length){
            $("#output").empty();
        };

        var latitude = $("input[id='latitudeSearch']").val();
        var longitude = $("input[id='longitudeSearch']").val();

        fn._data.coords = {
            "lng": parseFloat(longitude),
            "lat": parseFloat(latitude),
        };

        var checkExist = setInterval(function(){
            var lngCheck = _.has(fn._data.coords, "lng");
            var latCheck = _.has(fn._data.coords, "lat");
            if (lngCheck === false && latCheck === false){
                fn.displayAlert(
                    "#388B90",
                    "Sorry. " + error.message,
                    "An attempt to locate your position timed out. Please refresh the page and try again."
                );
            } else {
                clearInterval(checkExist);
                $(".data-loading").addClass("hidden");
                fn._render();
            };
        }, 500);
    },

    _render: function(){
        fn.identifyBoundaries();
        if (fn._data.reps.count > 4){
            console.log("whoa");
        } else if (fn._data.reps.count === 4){
            fn._data.proceed = true;
            fn.gatherData();
        } else if (fn._data.reps.count === 3){
            fn._data.proceed = true;
            fn.gatherData();
        } else if (fn._data.reps.count === 2){
            fn._data.proceed = true;
            fn.gatherData();
        } else if (fn._data.reps.count === 1){
            fn._data.proceed = true;
            fn.compileDetails(fn._data.reps.gov.details);
        } else {
            fn._data.reps.proceed = false;
            fn.displayAlert(
                "red",
                "Sorry we were unable to complete your search.",
                "We can't determine your representatives from your location. Perhaps you are not in California?"
            );
        };
    },

    identifyBoundaries: function(data){
        fn._data.reps = {};
        fn._data.reps.count = 0;
        var _this = fn._data.wherewolf;
        var found_lac = _this.lac.find(fn._data.coords, {wholeFeature: true}["districts"]);
        var null_lac = _.isNull(found_lac["districts"]);
        var found_sen = _this.sen.find(fn._data.coords, {wholeFeature: true}["districts"]);
        var null_sen = _.isNull(found_sen["districts"]);
        var found_asem = _this.asem.find(fn._data.coords, {wholeFeature: true}["districts"]);
        var null_asem = _.isNull(found_asem["districts"]);
        if (null_lac === false){
            fn._data.reps.lac = _this.lac.find(fn._data.coords, {wholeFeature: true})["districts"]["properties"];
            fn._data.reps.count += 1;
        } else {
            fn._data.reps.lac = null;
        };
        if (null_sen === false){
            fn._data.reps.sen = _this.sen.find(fn._data.coords, {wholeFeature: true})["districts"]["properties"];
            fn._data.reps.count += 1;
        } else {
            fn._data.reps.sen = null;
        };
        if (null_sen === false){
            fn._data.reps.asem = _this.asem.find(fn._data.coords, {wholeFeature: true})["districts"]["properties"];
            fn._data.reps.count += 1;
        } else {
            fn._data.reps.asem = null;
        };
        fn._data.reps.gov = {};
        fn._data.reps.gov.details = {
            rep_name: "Gov. Jerry Brown",
            email: "Jerry.Brown@gov.ca.gov",
            district_name: "California Governor",
            party: "Democrat",
            short_party: "D",
            address: "State Capitol Suite 1173",
            city: "Sacramento",
            state: "CA",
            zip: "95814",
            phones: "(916) 445-2841",
        };
        fn._data.reps.count += 1;
    },

    gatherData: function(){
        $.getJSON(fn._s3url + "state_rep_data.json", function(data){
            fn._data.reps.sen.details = _.where(data, {
                chamber: "senate",
                district_id: fn._data.reps.sen.external_id
            });
            fn._data.reps.asem.details = _.where(data, {
                chamber: "assembly",
                district_id: fn._data.reps.asem.external_id
            });
        });
        var checkExist = setInterval(function(){
            var senCheck = _.has(fn._data.reps.sen, "details");
            var asemCheck = _.has(fn._data.reps.asem, "details");
            if (senCheck === true && asemCheck === true){
                clearInterval(checkExist);
                if (fn._data.reps.count === 4){
                    fn.compileDetails(fn._data.reps.sen.details[0]);
                    fn.compileDetails(fn._data.reps.asem.details[0]);
                    fn.compileDetails(fn._data.reps.lac.details);
                    fn.compileDetails(fn._data.reps.gov.details);
                } else if (fn._data.reps.count === 3){
                    fn.compileDetails(fn._data.reps.sen.details[0]);
                    fn.compileDetails(fn._data.reps.asem.details[0]);
                    fn.compileDetails(fn._data.reps.gov.details);
                } else if (fn._data.reps.count === 2){
                    fn.compileDetails(fn._data.reps.sen.details[0]);
                    fn.compileDetails(fn._data.reps.asem.details[0]);
                }
            };
        }, 500);
    },

    compileDetails: function(rep){
        console.log(rep);
        var mailto = fn.generateMailTo(rep.email, "homeless@scpr.org");
        if (rep.short_party != null || rep.short_party != undefined){
            var title = rep.short_party + "&mdash;" + rep.district_name;
        } else {
            var title = rep.district_name;
        }
        var address = rep.address + "<br />" + rep.city + ", " + rep.state + " " + rep.zip;
        var rep_deets = fn.writeToDom(
            "representative",
            rep.rep_name,
            title,
            address,
            rep.phones,
            "<a href='" + mailto + "' target='_top'>" + rep.email + "</a>"
        );
        fn.displayOfficials("#output", rep_deets);
    },

    generateMailTo: function(email, cc){
        var subject = "Homeless%20Families";
        var body = "Fox News treated me terrible, I tweeted winner smarter Mexico self-funded doesn't know what he is doing bomb the oil fields, bang I'm Protestant lock her up. \n\n Muslims Celebrating the blacks love me I was talking about her persona twitter followers anchor baby the big lie. \n\n Beating us up email scandal politician Muslims Celebrating no time for political correctness. \n\n Yuge hair tweeted bigly.";
        return "mailto:" + email + "?cc=" + cc + "&subject=" + subject + "&body=" + escape(body);
    },

    writeToDom: function(selector, name, office, address, phone, email){
        var html = "<div class='" + selector + " flex-item'>" +
            "<p>" + name + "<br />" +
            office + "<br />" +
            address + "<br />" +
            phone + "<br />" +
            email + "</p>" +
            "</div>";
        return html;
    },

    displayOfficials: function(selector, details){
        $(selector).append(details);
    },

    displayAlert: function(color, title, content){
        $("#output").css("height", "150px");
        $("#output").html(
            "<div><h4 style='" + color + "'>" + title + "</h4>" +
            "<p style='" + color + "'>" + content + "</p>"
        );
    }
};

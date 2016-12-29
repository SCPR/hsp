'use strict';

const jQuery   = require('jquery');
const $        = jQuery;
const Wherewolf   = require('wherewolf');

var fn = fn || {};

$(document).ready(function(){
    fn._init();
});

var fn = {

    _data: "https://s3-us-west-1.amazonaws.com/scpr-projects/state_rep_boundaries/",

    _init: function(){
        fn._events();
        window.wherewolf = {};
        window.wherewolf.lac = Wherewolf();
        window.wherewolf.ca_sen = Wherewolf();
        window.wherewolf.ca_asem = Wherewolf();
        fn.loadData(window.wherewolf);
    },

    _events: function(){

        // trigger to address search
        $("input[id='addressSearch']").focus(function(event){
            fn.searchMe()
            fn.addressSearch(event);
        });

        // trigger to submit users address
        $("button#submit").click(function(event){
            event.preventDefault();
            fn.navigate();
        });

        // trigger to find users location
        $("button#findme").click(function(event){
            event.preventDefault();
            $(".data-loading").removeClass("hidden");
            fn.findMe();
        });

        // trigger to reset the view
        $("button#reset").click(function(){
            fn.reset();
        });

    },

    loadData: function(wherewolf){
        $.getJSON(fn._data + "la-county-board-of-supervisors-districts-2011.json", function(data){
            window.wherewolf.lac.addAll(data);
        });
        $.getJSON(fn._data + "state-senate-districts-2011.json", function(data){
            window.wherewolf.ca_sen.addAll(data);
        });
        $.getJSON(fn._data + "state-assembly-districts-2011.json", function(data){
            window.wherewolf.ca_asem.addAll(data);
        });
    },

    searchMe: function(){
        $("button#submit").css("font-weight", "700");
        $("button#findme").css("font-weight", "100");
        $("input[id='addressSearch']").val("");
        $("input[id='latitudeSearch']").val("");
        $("input[id='longitudeSearch']").val("");
        $("#output").empty();
    },

    addressSearch: function(event){
        event.preventDefault();
        $("input[id='addressSearch']").geocomplete({
            details: "form"
        });
    },

    enterKeyPressedEventHandler: function(event){
        if(event.keyCode === 13){
            fn.navigate();
        };
    },

    findMe: function(){
        $("button#submit").css("font-weight", "100");
        $("button#findme").css("font-weight", "700");
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

    reset: function(){
        $(".searchMe").css("font-weight", "700");
        $(".findMe").css("font-weight", "700");
        $("input[id='addressSearch']").val('');
        $("input[id='latitudeSearch']").val('');
        $("input[id='longitudeSearch']").val('');
        $("#output").empty();
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

    navigate: function(){
        if ($("#output").length){
            $("#output").empty();
        };
        var latitude = $("input[id='latitudeSearch']").val();
        var longitude = $("input[id='longitudeSearch']").val();
        if (latitude === undefined && longitude === undefined){
            fn.displayAlert(
                "red",
                "Sorry.",
                "Please enter an address or search by location."
            );
            window.coords = false;
        } else {
            window.coords = {
                "lng": parseFloat(longitude),
                "lat": parseFloat(latitude),
            }
        };
        if (_.isEmpty(window.coords) === true){
            fn.displayAlert(
                "#388B90",
                "Sorry. " + error.message,
                "An attempt to locate your position timed out. Please refresh the page and try again."
            );
        } else {
            $(".data-loading").addClass("hidden");
            window.reps = fn.identifyBoundaries(window.coords);
            if (window.reps.count === 3){
                window.reps.proceed = true;
            } else if (window.reps.count === 2){
                window.reps.proceed = true;
            } else if (window.reps.count === 1){
                window.reps.proceed = false;
            } else {
                window.reps.proceed = false;
            };
            if (window.reps.proceed === false){
                fn.displayAlert(
                    "red",
                    "Sorry we were unable to complete your search.",
                    "We can't determine your representatives from your location. Perhaps you are not in California?"
                );
            } else {
                fn.gather_data();
            };
        };
    },

    identifyBoundaries: function(coords){
        var _this = window.wherewolf;
        var found_reps = {};
        found_reps.count = 0
        var found_la = _this.lac.find(window.coords, {wholeFeature: true}["districts"]);
        var _null_la = _.isNull(found_la["districts"]);
        var found_sen = _this.ca_sen.find(window.coords, {wholeFeature: true}["districts"]);
        var _null_sen = _.isNull(found_sen["districts"]);
        var found_asem = _this.ca_asem.find(window.coords, {wholeFeature: true}["districts"]);
        var _null_asem = _.isNull(found_asem["districts"]);
        if (_null_la === false){
            found_reps.la = _this.lac.find(window.coords, {wholeFeature: true})["districts"]["properties"];
            found_reps.count += 1;
        } else {
            found_reps.la = null;
        };
        if (_null_sen === false){
            found_reps.sen = _this.ca_sen.find(window.coords, {wholeFeature: true})["districts"]["properties"];
            found_reps.count += 1;
        } else {
            found_reps.sen = null;
        };
        if (_null_sen === false){
            found_reps.asem = _this.ca_asem.find(window.coords, {wholeFeature: true})["districts"]["properties"];
            found_reps.count += 1;
        } else {
            found_reps.asem = null;
        };
        return found_reps;
    },

    gather_data: function(){
        $.getJSON(fn._data + "state_rep_data.json", function(data){
            window.reps.sen.details = _.where(data, {
                chamber: "senate",
                district_id: window.reps.sen.external_id
            });
            window.reps.asem.details = _.where(data, {
                chamber: "assembly",
                district_id: window.reps.asem.external_id
            });
        });

        window.reps.gov = {};
        window.reps.gov.details = {
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

        var checkExist = setInterval(function(){
            var senCheck = _.has(window.reps.sen, "details");
            var asemCheck = _.has(window.reps.asem, "details");
            if (senCheck === true && asemCheck === true){
                clearInterval(checkExist);
                if (window.reps.count === 3){
                    fn.compileDetails(window.reps.sen.details[0]);
                    fn.compileDetails(window.reps.asem.details[0]);
                    fn.compileDetails(window.reps.la.details);
                    fn.compileDetails(window.reps.gov.details);
                } else if (window.reps.count === 2){
                    fn.compileDetails(window.reps.sen.details[0]);
                    fn.compileDetails(window.reps.asem.details[0]);
                    fn.compileDetails(window.reps.gov.details);
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

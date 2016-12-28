'use strict';

const jQuery   = require('jquery');
const $        = jQuery;

var fn = fn || {};

$(document).ready(function(){
    // fn._init();

    console.log("works");

});

var fn = {

    _init: function(){
        fn._events();
        window.wherewolf = {};
        window.wherewolf.la_county = Wherewolf();
        window.wherewolf.ca_senate = Wherewolf();
        window.wherewolf.ca_asem = Wherewolf();
        fn.loadData(window.wherewolf);
    },

    _events: function(){

        // trigger to access user's location
        $(".action-controls a").click(function(){
            var target_function = $(this).attr("class");
            if (target_function === "searchMe"){
                fn.searchMe();
            } else {
                $(".data-loading").removeClass("hidden");
                fn.findMe();
            };
        });

        // trigger to address search
        $("input[id='addressSearch']").focus(function(event){
            fn.addressSearch(event);
        });

        // trigger to access user's state reps
        $("button#submit").click(function(){
            fn.navigate();
        });

        // trigger to reset the view
        $("button#reset").click(function(){
            fn.reset();
        });

    },

    loadData: function(wherewolf){
        $.getJSON("{% static 'data/la-county-board-of-supervisors-districts-2011.json' %}", function(data){
            window.wherewolf.la_county.addAll(data);
        });
        $.getJSON("{% static 'data/state-senate-districts-2011.json' %}", function(data){
            window.wherewolf.ca_senate.addAll(data);
        });
        $.getJSON("{% static 'data/state-assembly-districts-2011.json' %}", function(data){
            window.wherewolf.ca_asem.addAll(data);
        });
    },

    searchMe: function(){
        $("#form-controls").removeClass("hidden");
        $(".searchMe").css("font-weight", "700");
        $("img.searchMe").css("opacity", "1.0");
        $(".findMe").css("font-weight", "100");
        $("img.findMe").css("opacity", "0.3");
        $("input[id='addressSearch']").val("");
        $("input[id='latitudeSearch']").val("");
        $("input[id='longitudeSearch']").val("");
    },

    addressSearch: function(event){
        event.preventDefault();
        $("input[id='addressSearch']").geocomplete({
            details: "form"
        });
    },

    enterKeyPressedEventHandler: function(event){
        if(event.keyCode === 13){
            $(".data-loading").removeClass("hidden");
            fn.navigate();
        };
    },

    findMe: function(){
        var location_options = {
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 10000
        };
        $("#form-controls").addClass("hidden");
        $(".findMe").css("font-weight", "700");
        $("img.findMe").css("opacity", "1.0");
        $(".searchMe").css("font-weight", "100");
        $("img.searchMe").css("opacity", "0.3");
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                fn.locationSuccess,
                fn.locationError,
                location_options
            );
        } else {
            $.jAlert({
                "replaceOtherAlerts": true,
                "closeOnClick": true,
                "theme": "yellow",
                "title": "<strong>Sorry.</strong>",
                "content": "Your browser lacks geolocation capabilities."
              });
        };
    },

    locationSuccess: function(position){
        $("input[id='latitudeSearch']").val(position.coords.latitude);
        $("input[id='longitudeSearch']").val(position.coords.longitude);
        $("button#submit").trigger("click");
    },

    locationError: function(error){
        if (error.code === 1){
            $.jAlert({
                "replaceOtherAlerts": true,
                "closeOnClick": true,
                "theme": "yellow",
                "title": "<strong>Sorry. " + error.message + "</strong>",
                "content": "The user denied use of location services or your privacy settings do not allow this application to determine your current location."
              });
        } else if (error.code === 2){
            $.jAlert({
                "replaceOtherAlerts": true,
                "closeOnClick": true,
                "theme": "yellow",
                "title": "<strong>Sorry. " + error.message + "</strong>",
                "content": "We could not find your location."
              });
        } else if (error.code === 3){
            $.jAlert({
                "replaceOtherAlerts": true,
                "closeOnClick": true,
                "theme": "yellow",
                "title": "<strong>Sorry. " + error.message + "</strong>",
                "content": "An attempt to locate your position timed out. Please refresh the page and try again."
              });
        };
    },

    navigate: function(){
        if ($("#reps").length){
            $("#reps").empty();
        };
        var latitude = $("input[id='latitudeSearch']").val();
        var longitude = $("input[id='longitudeSearch']").val();
        if (latitude === undefined && longitude === undefined){
            $.jAlert({
                "replaceOtherAlerts": true,
                "closeOnClick": true,
                "theme": "yellow",
                "title": "<strong>Sorry.</strong>",
                "content": "Please enter an address or search by location."
              });
            window.coords = false;
        } else {
            window.coords = {
                "lng": parseFloat(longitude),
                "lat": parseFloat(latitude),
            }
        };
        if (_.isEmpty(window.coords) === true){
            $.jAlert({
                "replaceOtherAlerts": true,
                "closeOnClick": true,
                "theme": "yellow",
                "title": "<strong>Sorry. " + error.message + "</strong>",
                "content": "An attempt to locate your position timed out. Please refresh the page and try again."
              });
        } else {
            fn.identifyDetails(window.coords);
        };
    },

    reset: function(){
        $("#submit").removeClass("hidden");
        $("#reset").addClass("hidden");
        $("#form-controls").addClass("hidden");
        $(".searchMe").css("font-weight", "700");
        $("img.searchMe").css("opacity", "1.0");
        $(".findMe").css("font-weight", "700");
        $("img.findMe").css("opacity", "1.0");
        $("input[id='addressSearch']").val('');
        $("input[id='latitudeSearch']").val('');
        $("input[id='longitudeSearch']").val('');
        $("#reps").empty();
    },

    identifyDetails: function(coords){
        window.reps = {};
        window.reps.county = window.wherewolf.la_county.find(window.coords, {wholeFeature: true})["districts"]["properties"];
        window.reps.senate = window.wherewolf.ca_senate.find(window.coords, {wholeFeature: true})["districts"]["properties"];
        window.reps.asem = window.wherewolf.ca_asem.find(window.coords, {wholeFeature: true})["districts"]["properties"];
        $.getJSON("{% static 'data/state_rep_data.json' %}", function(data){
            window.reps.senate.details = _.where(data, {
                chamber: "senate",
                district_id: window.reps.senate.external_id
            });
            window.reps.asem.details = _.where(data, {
                chamber: "assembly",
                district_id: window.reps.asem.external_id
            });
        });

        var checkExist = setInterval(function() {
            var senateCheck = _.has(window.reps.senate, "details");
            var asemCheck = _.has(window.reps.asem, "details");
            var countyCheck = _.has(window.reps.county, "details");
            if (senateCheck === true && asemCheck === true && countyCheck === true){
                clearInterval(checkExist);
                var ready_data = window.reps;
                fn.displayOfficials(ready_data);
            } else {
                $.jAlert({
                    "replaceOtherAlerts": true,
                    "closeOnClick": true,
                    "theme": "red",
                    "title": "<strong>Sorry.</strong>",
                    "content": "We can't determine your representatives from the address you entered. Try a more specific address or use your current location."
                  });
            };
        }, 500);
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

    displayOfficials: function(reps){
        $(".data-loading").addClass("hidden");
        $("#submit").addClass("hidden");
        $("#reset").removeClass("hidden");
        $("#letter-display").removeClass("hidden");
        var div_size = 12 / 4
        var selector = "col-xs-" + div_size + " col-sm-" + div_size + " col-md-" + div_size + " col-lg-" + div_size;

        var gov_mailto = fn.generateMailTo("Jerry.Brown@gov.ca.gov", "homeless@scpr.org");
        var gov_title = "D&mdash;California Governor";
        var gov_address = "State Capitol, Suite 1173<br />Sacramento, CA 95814";
        var gov_deets = fn.writeToDom(
            selector,
            "Gov. Jerry Brown",
            gov_title,
            gov_address,
            "(916) 445-2841",
            "<a href='" + gov_mailto + "' target='_top'>" + "Email Gov. Jerry Brown</a>"
        );
        $("#reps").append(gov_deets);


        var sen = reps.senate.details[0];
        var sen_mailto = fn.generateMailTo(sen.email, "homeless@scpr.org");
        var sen_title = sen.short_party + "&mdash;" + sen.district_name;
        var sen_address = sen.address + "<br />" + sen.city + ", " + sen.state + " " + sen.zip;
        var sen_deets = fn.writeToDom(
            selector,
            sen.rep_name,
            sen_title,
            sen_address,
            sen.phones,
            "<a href='" + sen_mailto + "' target='_top'>" + "Email " + sen.rep_name + "</a>"
        );
        $("#reps").append(sen_deets);

        var asem = reps.asem.details[0];
        var asem_mailto = fn.generateMailTo(asem.email, "homeless@scpr.org");
        var asem_title = asem.short_party + "&mdash;" + asem.district_name;
        var asem_address = asem.address + "<br />" + asem.city + ", " + asem.state + " " + asem.zip;
        var asem_deets = fn.writeToDom(
            selector,
            asem.rep_name,
            asem_title,
            asem_address,
            asem.phones,
            "<a href='" + asem_mailto + "' target='_top'>" + "Email " + asem.rep_name + "</a>"
        );
        $("#reps").append(asem_deets);

        var supe = reps.county.details;
        var supe_mailto = fn.generateMailTo(supe.rep_email, "homeless@scpr.org");
        var supe_title = supe.district_name;
        var supe_address = supe.address + "<br />" + supe.city + ", " + supe.state + " " + supe.zip;
        var supe_deets = fn.writeToDom(
            selector,
            supe.rep_name,
            supe_title,
            supe_address,
            supe.phones,
            "<a href='" + supe_mailto + "' target='_top'>" + "Email " + supe.rep_name + "</a>"
        );
        $("#reps").append(supe_deets);
    }
};

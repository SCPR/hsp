'use strict';

const jQuery    = require('jquery');
const _         = require('underscore')._;
const Wherewolf = require('wherewolf');

module.exports = (scope) => {

    var $  = (selector) => { return jQuery(scope).find(selector); }

    var fn = {

        _s3url: "https://s3-us-west-1.amazonaws.com/scpr-projects/state_rep_boundaries/",

        _data: {},

        _init: function(){
            fn._data.wherewolf = {};
            fn._data.wherewolf.lac = Wherewolf();
            fn._data.wherewolf.sen = Wherewolf();
            fn._data.wherewolf.asem = Wherewolf();
            fn.setEvents();
            fn.loadData();
        },

        setEvents: function(){

            // trigger to address search
            $("input[id='addressSearch']").focus(function(){
                fn.searchMe();
            });

            // trigger to find users location
            $("button#findme").click(function(event){
                event.preventDefault();
                $(".data-loading").removeClass("hidden");
                fn.findMe();
            });

            // trigger to submit users address
            $("button#submit").click(function(event){
                event.preventDefault();
                $(".data-loading").removeClass("hidden");
                fn.processLocation();
            });
        },

        loadData: function(){
            jQuery.getJSON(`${fn._s3url}la-county-board-of-supervisors-districts-2011.json`, (data) => {
                fn._data.wherewolf.lac.addAll(data);
            });

            jQuery.getJSON(`${fn._s3url}state-senate-districts-2011.json`, (data) =>{
                fn._data.wherewolf.sen.addAll(data);
            });

            jQuery.getJSON(`${fn._s3url}state-assembly-districts-2011.json`, (data) =>{
                fn._data.wherewolf.asem.addAll(data);
            });
        },

        resetMe: function(){
            $("#output").empty();
            $("input[id='addressSearch']").val("");
            $("input[id='latitudeSearch']").val("");
            $("input[id='longitudeSearch']").val("");
        },

        searchMe: function(){
            $("button#submit").css("font-weight", "700");
            $("button#_findme").css("font-weight", "100");
            fn.resetMe();
            $("input[id='addressSearch']").geocomplete({
                details: "form"
            });
        },

        findMe: function(){
            $("button#submit").css("font-weight", "100");
            $("button#_findme").css("font-weight", "700");
            fn.resetMe();
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
                $(".data-loading").addClass("hidden");
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
                $(".data-loading").addClass("hidden");
                fn.displayAlert(
                    "red",
                    `Sorry ${error.message}`,
                    `The user denied use of location services
                    or your privacy settings do not allow this
                    application to determine your current location.`
                );
            } else if (error.code === 2){
                $(".data-loading").addClass("hidden");
                fn.displayAlert(
                    "#388B90",
                    `Sorry ${error.message}`,
                    "We could not find your location."
                );
            } else if (error.code === 3){
                $(".data-loading").addClass("hidden");
                fn.displayAlert(
                    "#388B90",
                    `Sorry ${error.message}`,
                    `An attempt to locate your position timed out.
                    Please refresh the page and try again.`
                );
            };
        },

        processLocation: function(){
            $("#output").empty();
            var latitude = $("input[id='latitudeSearch']").val();
            var longitude = $("input[id='longitudeSearch']").val();
            fn._data.coords = {
                "lng": parseFloat(longitude),
                "lat": parseFloat(latitude),
            };
            $("#progress-message").html("Validating your location");
            var checkExist = setInterval(function(){
                var lngNull = _.has(fn._data.coords, "lng");
                var latNull = _.has(fn._data.coords, "lat");
                var lngNaN = _.isNaN(fn._data.coords.lng);
                var latNaN = _.isNaN(fn._data.coords.lat);
                if (lngNull === false && latNull === false){
                    clearInterval(checkExist);
                    $(".data-loading").addClass("hidden");
                    fn.displayAlert(
                        "#388B90",
                        "Sorry \n",
                        `An attempt to locate your position timed out.
                        Please refresh the page and try again.`
                    );
                } else if (lngNaN === true && latNaN === true){
                    clearInterval(checkExist);
                    $(".data-loading").addClass("hidden");
                    fn.displayAlert(
                        "#388B90",
                        "Sorry \n",
                        `You may have entered an incomplete address.
                        Please enter your complete address.`
                    );
                } else {
                    clearInterval(checkExist);
                    fn._render();
                };
            }, 1000);
        },

        _render: function(){
            fn.identifyBoundaries();
            if (fn._data.reps.count > 4){
                $(".data-loading").addClass("hidden");
                fn.displayAlert(
                    "red",
                    "Sorry we were unable to complete your search.",
                    "We can't determine your representatives from your location. Perhaps you are not in California?"
                );
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
                $(".data-loading").addClass("hidden");
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
            $("#progress-message").html("Finding your representatives");
            jQuery.getJSON(`${fn._s3url}state_rep_data.json`, function(data){
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
            var mailto = fn.generateMailTo(rep.rep_name, rep.email, "homeless@scpr.org");
            if (rep.short_party != null || rep.short_party != undefined){
                var title = rep.short_party + "&mdash;" + rep.district_name;
            } else {
                var title = rep.district_name;
            }
            var address = rep.address + "<br />" + rep.city + ", " + rep.state + " " + rep.zip;
            var rep_deets = fn.writeToDom(
                "rep-block",
                rep.rep_name,
                title,
                address,
                rep.phones,
                `<a href="${mailto}" target="_top">${rep.email}</a>`
            );
            $(".data-loading").addClass("hidden");
            fn.displayOfficials("#output", rep_deets);
        },

        generateMailTo: function(name, email, cc){
            var subject = "Homeless%20Families";
            var body = "Dear " + name + ":\n\nI'm concerned about growing family homelessness in California.\n\nPublic radio KPCC is reporting that:\n\n- Nearly 60,000 families called L.A. County's 211 line for help finding emergency shelter in 2015. And women and children surpassed the number of single men seeking refuge at Los Angeles' Union Rescue Mission on Skid Row last year -- the first time that's happened in its 125-year history.\n\n- Since 2010, eight infants identified by Los Angles County officials as homeless died sleeping in conditions experts call unsuitable, but were the families only option.\n\n- Harvest Home, in Venice, can take in about two dozen pregnant women at a time. Workers there estimate they had to turn away about 500 pregnant women last year.\n\n- Orange and San Bernardino county school officials report the number of students without stable housing tripled over the past decade, to 26,064 in Orange County public schools and 35,165 in San Bernardino. Los Angeles public schools have identified 54,916 homeless students.\n\nWhat are you doing to reduce the number of children and families in my community who become homeless?";
            return "mailto:" + email + "?cc=" + cc + "&subject=" + subject + "&body=" + escape(body);
        },

        writeToDom: function(selector, name, office, address, phone, email){
            return `<div class="${selector} flex-item">
                <p>
                    <span class="name">${name}</span><br />
                    <span class="office">${office}</span><br />
                    <hr>
                    <span class="address">${address}</span><br />
                    <span class="phone">${phone}</span><br />
                    <span class="email">${email}</span><br />
                </p>
                </div>`;
        },

        displayOfficials: function(selector, details){
            $(selector).append(details);
        },

        displayAlert: function(color, title, content){
            $("#output").html(`<div><h4 style="${color}">${title}</h4><p style="${color}">${content}</p>`);
        }
    };

    fn._init();

};

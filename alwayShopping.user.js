// ==UserScript==
// @name         always shopping
// @namespace    http://github.com/bluebeckie
// @version      1.0.0
// @description  based on the weather info where the user is at, we present her suitable items from yahoo shopping to buy
// @author       beckie
// @match        https://*.yahoo.com/*
// @require      http://code.jquery.com/jquery-2.1.4.min.js
// @grant        none
// ==/UserScript==

(function(){
    var getGeo = function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition( function(pos) {
                getWoeId(pos.coords.latitude +','+ pos.coords.longitude);
            });
        } else {
            getWoeId('40.755970, -73.986702');
        };    
    };

    var getWoeId = function (latlon) {
        var query = encodeURIComponent('select woeid from geo.placefinder where text="'+ latlon + '" and gflags="R"');
        $.ajax({
            url: 'https://query.yahooapis.com/v1/public/yql?q=' + query + '&format=json',
            type: 'POST',
            complete: function(xhr, status) {
                if (status === 'error' || !xhr.responseText) {
                    getWeather('12703524');
                }
                else {
                    var data = $.parseJSON(xhr.responseText);
                    getWeather(data.query.results.Result.woeid);
                };
            }
        });
    };
    
    var getWeather = function (woeid) {
        //woeid = '12795439';
        var query = encodeURIComponent('select atmosphere, item.condition from weather.forecast where woeid=' + woeid);
        $.ajax({
            url: 'https://query.yahooapis.com/v1/public/yql?q=' + query + '&format=json',
            type: 'POST',
            complete: function(xhr, status) {
                if (status === 'error' || !xhr.responseText) {
                    analyzeWeather({
                        "code": "30",
                        "date": "Thu, 28 May 2015 6:00 pm CST",
                        "temp": "90",
                        "text": "Partly Cloudy",
                        "humidity" : "80"
                    });
                }
                else {
                    var data = $.parseJSON(xhr.responseText);
                    var humidity = data.query.results.channel.atmosphere.humidity;
                    var condition = data.query.results.channel.item.condition;
                    condition.humidity = humidity;
                    analyzeWeather(condition);
                };
            }
        }); 
    };
   
    var analyzeWeather = function (condition) {
        console.log(condition);
        var searchTerms = [];
        var humidity = condition.humidity;
        var temp = condition.temperature;
        var weather = condition.text;
        var random;
        
        if (humidity < 40) {
            searchTerms.push('加濕器');
        } else if (humidity > 70) {
            searchTerms.push('除濕機');
        };
        
        if (temp < 40) {
            searchTerms.push('暖氣');
        } else if (temp > 80) {
            searchTerms.push('冷氣');
        };
        
      
        if (weather.match(/sunny/i)) {
            searchTerms.push('防曬油');
        };
        
        if (weather.match(/rainy/i)) {
            searchTerms.push('雨鞋');
        };
        
        console.log(searchTerms);
        if (searchTerms.length > 0) {
            random = Math.floor(Math.random(searchTerms.length));
            searchShopping(searchTerms[random]);
        }
    };
    
    var searchShopping = function (term) {
        var query = encodeURIComponent('select hits from oneecsearch.search (0,1) where keyword="' +
            term +'" and property="shopping, mall"');
            //" and sortBy="price" and sortOrder="asc" and filters="ship_fast"');
        $.ajax({
            url: 'https://oneecsearch.yql.yahooapis.com/v1/public/yql?q=' + query + '&format=json',
            type: 'POST',
            complete: function(xhr, status) {
                if (status === 'error' || !xhr.responseText) {
                }
                else {
                    var data = $.parseJSON(xhr.responseText);
                    var product = data.query.results.result.hits;
                    
                    renderTemplate(product);
                };
            }
        });
    };
    
    var renderTemplate = function (product) {
        console.log(product.ec_title);
        
        var host;
        var template = ['<div style="border:1px solid #cccc;margin-bottom:10px;">',
                        '<a href="', product.ec_item_url , '">',
                        '<img src="', product.ec_image, '" width="300"/>',
                        '<h6 style="font-weight:bold;font-size:16px;">', product.ec_title, '</h6>',
                        '<p style="color:red;">$', product.ec_price, '</p>',
                        '</a>',
                        '</div>'].join('');
        console.log(template);
        if (document.querySelector('.End-0 #Aside')) {
            host = $('.End-0 #Aside');
        } else if (document.querySelector('.yom-secondary')) {
            host = $('.yom-secondary');
        } else if (document.querySelector('.yom-ad-lrec')) {
            host = $('.yom-ad-lrec');
        }
        console.log(host);
        if (host) {
            host.prepend(template);
        }
    };

    getGeo();
})();

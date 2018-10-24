"use strict";
// vanilla ajax call
window.getFeed = function(url) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = function() {
            if (xhr.status == 200) {
                resolve(JSON.parse(xhr.response));
            } else {
                reject(Error(xhr.statusText));
            }
        };
        xhr.onerror = function() {
            reject(Error("Network Error"));
        };
        xhr.send();
    });
}

// modules
window.CategorySingleFeed = require('./_modules/categorySingleFeedRecursive');
// init
(function(){
    // init category single product pull from feed
    var categoryFeeds = document.querySelectorAll('.ed--module-category-single-recursive');
    if (categoryFeeds.length) {
        for (var i = 0; i < categoryFeeds.length; i++) {
            new CategorySingleFeed(categoryFeeds[i]);
        }
    }
})();

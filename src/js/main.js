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

(function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:1009073,hjsv:6};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');

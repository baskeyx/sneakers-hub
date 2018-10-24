'use strict';
var CategorySingleFeedRecursive = function($target) {
    var self = this;
    self.$el = $target;
    self.$feedUrl = self.$el.dataset.feed;
    self.$ctaText = self.$el.dataset.itemcta;
    self.$title = self.$el.dataset.titlecat;
    self.$product = [];

    // get feed
    getFeed(self.$feedUrl).then(function(response) {
        // grab first item from the response, then build item in DOM
        self.$product = response.Products.List.slice(0,1);
        self.buildItem(self.$product[0]);

    }, function(error) {
        console.error(error);
    });
}

CategorySingleFeedRecursive.prototype.buildItem = function($product) {
    var self = this;

    var productImage = document.createElement('div');
    productImage.className = 'productImage';
    if ($product.ImageMain.endsWith('_255.jpg')) {
        var hiRes = $product.ImageMain.replace('_255.jpg','_1000.jpg');
    } else {
        var hiRes = $product.ImageMain;
    }
    productImage.style.backgroundImage = 'url('+hiRes+')';
    self.$el.append(productImage)

    var itemContentHolder = document.createElement('div');
    itemContentHolder.className = 'itemContentHolder';

    var itemTitle = document.createElement('h2');
    itemTitle.className = 'itemBrand styled';
    itemTitle.innerHTML = self.$title;
    itemContentHolder.append(itemTitle)

    var itemLink = document.createElement('a');
    itemLink.className = 'itemLink bold';
    itemLink.innerHTML = self.$ctaText;
    itemLink.href = self.$feedUrl.replace('?format=json','').replace('&format=json','');
    itemContentHolder.append(itemLink);

    self.$el.append(itemContentHolder)
}

module.exports = CategorySingleFeedRecursive;

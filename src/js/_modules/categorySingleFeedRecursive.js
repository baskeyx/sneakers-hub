'use strict';
var CategorySingleFeedRecursive = function($target) {
    var self = this;
    self.$el = $target;
    if (window.universal_variable.page.subfolder === '') {
        self.$recursiveURL = 'https://www.farfetch.com/uk/api/ecommerce/products/';
    } else {
        self.$recursiveURL = window.universal_variable.page.subfolder+'api/ecommerce/products/';
    }
    self.$recursiveImage = parseInt(self.$el.dataset.recursiveimage);
    self.$feedUrl = self.$el.dataset.feed;
    self.$ctaText = self.$el.dataset.itemcta;
    self.$title = self.$el.dataset.title;
    self.$subtitle = self.$el.dataset.subtitle;
    self.$products = [];
    // wide
    if (self.$el.dataset.iswide === 'yes') {
        self.$isWide = true;
        self.$el.className += ' wide';
    } else {
        self.$isWide = false
    }
    // if it's wide, but no recursive image has been set, use the default one
    if (self.$el.dataset.recursiveimagewide){
        self.$recursiveImageWide = parseInt(self.$el.dataset.recursiveimagewide);
    } else {
        self.$recursiveImageWide = self.$recursiveImage;
    }

    // get feed
    getFeed(self.$feedUrl).then(function(response) {
        if (self.$isWide) {
            // grab 2 products if it's wide
            self.$products = response.Products.List.slice(0,2);
        } else {
            // else just grab 1
            self.$products = response.Products.List.slice(0,1);
        }
        // build product
        self.buildItem(self.$products);

    }, function(error) {
        console.error(error);
    });
}

CategorySingleFeedRecursive.prototype.buildItem = function($products) {
    var self = this;
    // recursive product lookup for image
    $products.forEach(function(product,i){
        getFeed(self.$recursiveURL+product.ProductId).then(function(response) {
            var order;
            if (i === 0) {
                order = self.$recursiveImage
            } else {
                order = self.$recursiveImageWide
            }
            var images = response.images.images;
            var recursiveImage = images.filter(function(item){return item['order'] === order})
            recursiveImage = recursiveImage.filter(function(item){return item['size'] === '800'})[0]
            var productImage = document.createElement('div');
            productImage.className = 'productImage';
            if (i > 0) {
                productImage.className += ' right';
            }
            productImage.style.backgroundImage = 'url('+recursiveImage.url+')';

            var productLink = document.createElement('a');
            productLink.href = self.$feedUrl.replace('?format=json','').replace('&format=json','') + '?from=sneakers-hub';
            productLink.className = 'productLink';
            productLink.dataset.ffref = 'sneakershub';
            productLink.append(productImage)
            self.$el.append(productLink)
        }, function(error) {
            console.error(error);
        });
    })

    var itemContentHolder = document.createElement('div');
    itemContentHolder.className = 'itemContentHolder';

    var itemContentHolderTop = document.createElement('div');
    itemContentHolderTop.className = 'itemContentHolderTop';

    var itemSubTitle = document.createElement('h3');
    itemSubTitle.className = 'itemSubTitle text bold';
    itemSubTitle.innerHTML = self.$subtitle;
    itemContentHolderTop.append(itemSubTitle)

    var itemTitle = document.createElement('h2');
    itemTitle.className = 'itemTitle bold text';
    itemTitle.innerHTML = self.$title;
    itemContentHolderTop.append(itemTitle);

    var itemContentHolderBottom = document.createElement('div');
    itemContentHolderBottom.className = 'itemContentHolderBottom';

    var itemLink = document.createElement('a');
    itemLink.className = 'itemLink bold';
    itemLink.innerHTML = self.$ctaText;
    itemLink.dataset.ffref = 'sneakershub';
    itemLink.href = self.$feedUrl.replace('?format=json','').replace('&format=json','')  + '?from=sneakers-hub';
    itemContentHolderBottom.append(itemLink);

    itemContentHolder.append(itemContentHolderTop);
    itemContentHolder.append(itemContentHolderBottom);
    self.$el.append(itemContentHolder);
}

module.exports = CategorySingleFeedRecursive;

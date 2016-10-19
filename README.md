# Tiny Immutable data container with events api. [![Build Status](https://travis-ci.org/honewatson/immute.js.svg?branch=master)](https://travis-ci.org/honewatson/immute.js)
:page_with_curl: Tiny Immutable data container with events api.

## Features
* Tiny - Less than 7KB minified
* Set object values by a path string
* Add event listeners for updates of object properties

```javascript

var immute = new Immute({});

// Object now has 'donkey' property
// immute.get().donkey == immute.get().response.donkey
var donkey = immute => response =>
    immute.set('donkey', response.donkey);

var lion = immute => response =>
    immute.set('lion', response.lion);

var monkey = immmute => response =>
    immute.set('monkey', response.monkey);

var footer = immmute => footer =>
    immute.set('footer', footer);

immute.on('response', [lion(immute), monkey(immute)]);

// When obj.response.donkey is set, set obj.footer with the same value
immute.on('response.donkey', footer(immute));

var state = immute.set('response', {
    donkey: 1,
    lion: 2,
    monkey: 3
}).get();

console.log(state);
// { response: {donkey: 1, lion:2, monkey:3}, donkey: 1, lion:2, monkey:3, footer: 1 }


```

# Installation
Just clone this repo and remove `.git` folder.


svg-dial
============

A customizable, responsive SVG dial UI element.

## Introduction

After becoming frustrated with the lack of flexibility and support of [jQuery-knob](http://anthonyterrien.com/knob/), I decided to create my own SVG dial that allowed me to customize the look and feel of the dial.

Though this element is designed to be highly customizable, it doesn't deviate from the design structure of the notch in the bottom section, the dial, etc.  However, colors, font styles, sizes, and some other items are all customizable.

This may fit your needs and asthetics, it may not.

## Usage

The only dependency this library has is on [Snap.svg](http://snapsvg.io/).  It assumes this library is available to the module, and is configured to look for it in the AMD, CommonJS (Browserify) and global environments.

### CommonJS (Browserify)

```js
var SVGDial = require('svg-dial');

new SVGDial({
  onChange: function(percentage){
    console.log(percentage);
  }
});
```

### AMD

```js
define(['svg-dial'], function(SVGDial) {
  new SVGDial({
    onChange: function(percentage){
      console.log(percentage);
    }
  });
});
```

### Global

```html
...
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/snap.svg/0.3.0/snap.svg-min.js"></script>
<script type="text/javascript">
  new SVGDial({
    onChange: function(percentage){
      console.log(percentage);
    }
  });
</script>
...
```

## API



## Contributing
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.SVGDial = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Find the distance between two points by a percentage
// e.g. [0, 10] at 25% === 2.5
exports.lerp = function(angle, a, b) {
  var t = (angle % 90) / 90;
  return a * (1 - t) + b * t;
};

// Simple object extend functionality
exports.defaults = function(base, defaults) {
  var result = {};
  var transferProps = function(obj) {
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = obj[key];
      }
    }
  }

  transferProps(defaults);
  transferProps(base);

  return result;
};
},{}],2:[function(require,module,exports){
var Currency = module.exports = function(value) {
  this.value = value;
};

module.exports = Currency;


},{}],3:[function(require,module,exports){
var Percentage = module.exports = function(value) {
  this.value = value;
};

module.exports = Percentage;
},{}],4:[function(require,module,exports){
var utils = require('./utils');
var Percentage = require('./values/percentage');
var Currency = require('./values/currency');




var calculateDropShadowAngle = function(angle) {
  var topLeftQuadrant = angle >= 0 && angle < 90;
  var topRightQuadrant = angle >= 90 && angle < 180;
  var bottomRightQuadrant = angle >= 180 && angle < 270;
  var bottomLeftQuadrant = angle >= 270 && angle <= 360;

  if (topLeftQuadrant) {
    return [utils.lerp(angle, 0, 8), utils.lerp(angle, 8, 0)];
  } else if (topRightQuadrant) {
    return [utils.lerp(angle, 8, 0), utils.lerp(angle, 0, -8)];
  } else if (bottomRightQuadrant) {
    return [utils.lerp(angle, 0, -8), utils.lerp(angle, -8, 0)];
  } else if (bottomLeftQuadrant) {
    return [utils.lerp(angle, -8, 0), utils.lerp(angle, 0, 8)];
  }
};

var convertDecimalPercentageToInteger = function(percentage) {
  Math.round(percentage * 100);
};




var SVGDial = function(el, options) {
  this.el = el;
  this.options = utils.defaults(options || {}, {
    disabled: false,
    frameSize: 200,
    ringWidth: 50,
    min: 0,
    max: 100,
    type: 'percentage',
    frameBackgroundColor: 'white',
    ringBackgroundColor: '#888',
    innerBackgroundColor: 'white',
    fontFamily: 'impact',
    fontSize: 24,
    fontStyle: 'none',
    fontWeight: 'none'
  });

  this.initialize();
};

SVGDial.create = function(el, options) {
  return new exports.SVGDial(el, options);
}

SVGDial.prototype = {

  config: function(options) {
    this.options = utils.defaults(options, this.options);
  },

  // expecting 0...1
  setValue: function(percentage) {
    var angle = this.convertPercentageToAngle(percentage);
    this.updateDial(angle);
  },

  initialize: function() {
    this.c = this.buildCanvas();
    this.dial = this.buildDial();

    var onChange = function(sx, sy, ax, ay, e) {
      this.updateDial(this.getAngle(ax, ay));
      this.executeCallback('onChange', [this.percentage]);
    };
    var onStart = function(x, y, e) {
      this.centerCoordinates = this.calculateDialCenterCoordinates();
      this.updateDial(this.getAngle(x, y));
      this.executeCallback('onStart', [this.percentage]);
    };
    var onEnd = function(x, y, e) {
      this.executeCallback('onEnd', [this.percentage]);
    };

    this.moveKnob(this.convertPercentageToAngle(0));
    this.innerCircle.drag(onChange, onStart, onEnd, this, this, this);
    this.outerCircle.drag(onChange, onStart, onEnd, this, this, this);

    this.executeCallback('onReady');
  },

  getAngle: function(x, y) {
    return Snap.angle(this.centerCoordinates.x, this.centerCoordinates.y, x, y);
  },

  buildCanvas: function() {
    var el;
    var svgHtml = '<svg style="width: ' + this.options.frameSize + 'px; height: ' + this.options.frameSize + 'px;"></svg>';

    if (this.el.jquery) {
      el = this.el[0];
    } else if (this.el instanceof HTMLElement) {
      el = this.el;
    } else {
      el = document.querySelector(this.el);
    }

    el.innerHTML = svgHtml;
    return Snap(el.getElementsByTagName('svg')[0]);
  },

  buildDial: function() {
    this.outerCircle = this.buildOuterCircle();
    this.innerCircle = this.buildInnerCircle();
    this.text = this.buildText();
  },

  buildOuterCircle: function() {
    var attributes = this.outerCircleAttributes = {
      x:      this.options.frameSize / 2,
      y:      this.options.frameSize / 2,
      radius: this.options.frameSize / 2
    }

    // describe triangle that extends from bottom left to center to bottom right
    var trianglePoints = function(frameSize) {
      return [0,0,0,frameSize,frameSize/2,frameSize/2,frameSize,frameSize,frameSize,0];
    };

    var outerCircle = this.c.circle(
      attributes.x,
      attributes.y,
      attributes.radius
    );

    outerCircle.attr({
      fill: this.c.gradient(this.calculateFillColor(this.options.ringBackgroundColor)),
      mask: this.c.polyline(trianglePoints(this.options.frameSize)).attr({ fill: this.options.frameBackgroundColor })
    });

    return outerCircle;
  },

  buildInnerCircle: function() {
    var attributes = this.innerCircleAttributes = {
      x:      this.outerCircleAttributes.x,
      y:      this.outerCircleAttributes.y,
      radius: this.outerCircleAttributes.radius - this.options.ringWidth
    };

    var buildDialKnob = function() {
      var left,
          right,
          top = this.options.ringWidth + 5,
          distance = (attributes.x - attributes.radius) + 5;

      left =  this.outerCircleAttributes.radius + (top * 0.5);
      right = this.outerCircleAttributes.radius - (top * 0.5);

      return this.c.polyline(
        distance,right,
        distance,left,
        distance - top,this.outerCircleAttributes.radius
      );
    };

    var innerCircle = this.c.circle(
      attributes.x,
      attributes.y,
      attributes.radius
    );
    var dropShadow = this.generateDropShadow();
    var dialKnob = buildDialKnob.call(this);

    var innerGrouping = this.c.group(innerCircle, dialKnob).attr({
      fill: this.calculateFillColor(this.options.innerBackgroundColor),
      filter: dropShadow,
      transform: ['rotate(0', this.options.frameSize / 2, this.options.frameSize / 2].join(' ')
    });

    return innerGrouping;
  },

  buildText: function() {
    return this.c.text(
      this.options.frameSize / 2,
      this.options.frameSize / 2 + (this.options.fontSize / 3),
      '0%'
    ).attr({
      fontFamily: this.options.fontFamily,
      fontSize: this.options.fontSize,
      fontWeight: this.options.fontWeight,
      fontStyle: this.options.fontStyle,
      textAnchor: 'middle'
    });
  },

  generateDropShadow: function(options) {
    var opts = utils.defaults(options || {}, {
      x: 0,
      y: this.options.ringWidth / 20,
      blur: 3,
      color: '#000',
      opacity: 0.2
    });

    return this.c.filter(Snap.filter.shadow( opts.x, opts.y, opts.blur, opts.color, opts.opacity ));
  },

  updateText: function(percentage) {
    this.text.attr({
      text: [convertDecimalPercentageToInteger(percentage),'%'].join('')
    });
  },

  calculateFillColor: function(background) {
    background = (background instanceof Array) ? background : [background];
    return 'l(0, 0.5, 1, 0.5)' + background.join('-');
  },

  convertAngleToPercentage: function(angle) {
    var startAngle = 315,
        endAngle = 225,
        value;

    if (startAngle < angle && 360 >= angle) {
      value = 45 - (360 - angle);
    } else {
      value = angle + 45
    }

    return value / (endAngle+45);
  },

  convertPercentageToAngle: function(percentage) {
    var startAngle = 315,
        endAngle = 225;

    var unadjustedAngle = (percentage * (endAngle+45)) + startAngle;
    return (unadjustedAngle > 360) ? unadjustedAngle - 360 : unadjustedAngle;
  },

  moveKnob: function(angle) {
    var dropShadowAlignment = calculateDropShadowAngle(angle);
    var dropShadow = this.generateDropShadow({ x: dropShadowAlignment[0], y: dropShadowAlignment[1]});

    this.innerCircle.attr({
      transform: ['rotate(', angle, this.options.frameSize / 2, this.options.frameSize / 2, ')'].join(' '),
      filter: dropShadow
    });
  },

  updateDial: function(angle) {
    if (this.options.disabled) {
      return;
    }

    // if the angle is in the white triangle area, don't do anything
    if (315 >= angle && 225 < angle) {
      return;
    }

    this.moveKnob(angle);
    this.percentage = this.convertAngleToPercentage(angle);
    this.updateText(this.percentage);
  },

  calculateDialCenterCoordinates: function() {
    var boundingBox = this.outerCircle.node.getBoundingClientRect();

    return {
      x: boundingBox.left + (boundingBox.height / 2),
      y: boundingBox.top + (boundingBox.height / 2)
    }
  },

  executeCallback: function(type, args) {
    if (this.options[type]) {
      this.options[type].apply(null, args);
    }
  }

};


module.exports = SVGDial;
},{"./utils":1,"./values/currency":2,"./values/percentage":3}]},{},[4])(4)
});
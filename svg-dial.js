//     svg-dial 1.0.0
//     (c) 2015 Michael Phillips
//     https://github.com/createbang/svg-dial


(function(factory) {
  var root = (typeof self == 'object' && self.self == self && self) ||
            (typeof global == 'object' && global.global == global && global);

  if (typeof define === 'function' && define.amd) {
    define(['snap', 'exports'], function(Snap, exports) {
      root.DialKnob = factory(root, exports, Snap);
    });
  } else if (typeof exports !== 'undefined') {
    var Snap = require('snapsvg');
    factory(root, exports, Snap);
  } else {
    root.DialKnob = factory(root, {}, root.Snap);
  }

}(function(root, exports, Snap) {

  var lerp = function(angle, a, b) {
    var t = (angle % 90) / 90
    return a * (1 - t) + b * t;
  };

  var calculateDropShadowAngle = function(angle) {
    if (angle >= 0 && angle < 90) {
      return [lerp(angle, 0, 8), lerp(angle, 8, 0)];
    } else if (angle >= 90 && angle < 180) {
      return [lerp(angle, 8, 0), lerp(angle, 0, -8)];
    } else if (angle >= 180 && angle < 270) {
      return [lerp(angle, 0, -8), lerp(angle, -8, 0)];
    } else {
      return [lerp(angle, -8, 0), lerp(angle, 0, 8)];
    }
  };

  var defaults = function(base, defaults) {
    var result = {};

    for (key in defaults) {
      result[key] = defaults[key];
    }
    for (key in base) {
      result[key] = base[key];
    }

    return result;
  };

  exports.DialKnob = function(el, options) {
    this.el = el || '#svg-dial';
    this.options = defaults(options || {}, {
      frameBackgroundColor: 'white',
      frameSize: 200,
      ringBackground: '#888',
      innerBackground: 'white',
      textFontFamily: 'impact',
      textFontSize: '24px',
      textFontStyle: 'none',
      textFontWeight: 'none',
      ringWidth: 50
    });

    this.initialize();
  };

  exports.DialKnob.create = function(el, options) {
    return new exports.DialKnob(el, options);
  }

  exports.DialKnob.prototype = {

    // expecting 0...1
    setValue: function(percentage) {
      var angle = this.convertPercentageToAngle(percentage);
      this.updateDial(angle);
    },

    initialize: function() {
      this.c = this.buildCanvas();
      this.dial = this.buildDial();

      dragOnMove = function(sx, sy, ax, ay, e) {
        this.updateDial(this.getAngle(ax, ay));
        this.executeCallback('onDragMove', [this.percentage]);
      };
      dragOnStart = function(x, y, e) {
        this.centerCoordinates = this.calculateDialCenterCoordinates();
        this.updateDial(this.getAngle(x, y));
        this.executeCallback('onDragStart', [this.percentage]);
      };
      dragOnEnd = function(x, y, e) {
        this.executeCallback('onDragEnd', [this.percentage]);
      };

      this.moveKnob(this.convertPercentageToAngle(0));
      this.innerCircle.drag(dragOnMove, dragOnStart, dragOnEnd, this, this, this);
      this.outerCircle.drag(dragOnMove, dragOnStart, dragOnEnd, this, this, this);

      this.executeCallback('onReady');
    },

    getAngle: function(x, y) {
      return Snap.angle(this.centerCoordinates.x, this.centerCoordinates.y, x, y);
    },

    buildCanvas: function() {
      var el;

      if (this.el.jquery) {
        el = this.el[0]
      } else if (this.el instanceof HTMLElement) {
        el = this.el
      } else {
        el = document.querySelector(this.el);
      }

      var svgHtml = '<svg style="width: ' + this.options.frameSize + 'px; height: ' + this.options.frameSize + 'px;"></svg>';
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

      var trianglePoints = function(frameSize) {
        return [0,0,0,frameSize,frameSize/2,frameSize/2,frameSize,frameSize,frameSize,0]
      };

      var outerCircle = this.c.circle(
        attributes.x,
        attributes.y,
        attributes.radius
      );

      outerCircle.attr({
        fill: this.c.gradient(this.calculateFillColor(this.options.background)),
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

      innerCircle = this.c.group(innerCircle, dialKnob).attr({
        fill: this.calculateFillColor(this.options.innerBackground),
        filter: dropShadow,
        transform: ['rotate(0', this.options.frameSize / 2, this.options.frameSize / 2].join(' ')
      });

      return innerCircle;
    },

    buildText: function() {
      return this.c.text(
        this.options.frameSize / 2,
        this.options.frameSize / 2 + (this.options.textFontSize / 3),
        '0%'
      ).attr({
        fontFamily: this.options.textFontFamily,
        fontSize: this.options.textFontSize,
        fontWeight: this.options.textFontWeight,
        fontStyle: this.options.textFontStyle,
        textAnchor: 'middle'
      });
    },

    generateDropShadow: function(options) {
      var opts = defaults(options || {}, {
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
        text: [Math.round(percentage * 100),'%'].join('')
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

      unadjustedAngle = (percentage * (endAngle+45)) + startAngle;
      return (unadjustedAngle > 360) ? unadjustedAngle - 360 : unadjustedAngle;
    },

    moveKnob: function(angle) {
      var dropShadowAlignment = calculateDropShadowAngle(angle);
      var dropShadow = this.generateDropShadow({ x: dropShadowAlignment[0], y: dropShadowAlignment[1]})

      this.innerCircle.attr({
        transform: ['rotate(', angle, this.options.frameSize / 2, this.options.frameSize / 2, ')'].join(' '),
        filter: dropShadow
      });
    },

    updateDial: function(angle) {
      // if the angle is in the white triangle area, don't do anything
      if (315 >= angle && 225 < angle)
        return

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
      if (this.options[type])
        this.options[type].apply(null, args);
    }

  };

  return exports.DialKnob;

}));
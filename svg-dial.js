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

  exports.DialKnob = function(elSelector, options) {
    this.elSelector = elSelector || '#svg-dial';
    this.options = this.defaults(options || {});
    this.initialize();
  };

  exports.DialKnob.prototype = {

    defaults: function(options) {
      var defaults = {
        frameBackgroundColor: 'white',
        frameSize: 200,
        ringBackground: '#888',
        innerBackground: 'white',
        textFontFamily: 'impact',
        textFontSize: '24px',
        ringWidth: 50
      };

      for (key in options) {
        defaults[key] = options[key];
      }

      return defaults;
    },

    initialize: function() {
      this.c = this.buildCanvas();
      this.dial = this.buildDial();

      dragOnMove = function(sx, sy, ax, ay, e) {
        this._updateDial(ax, ay);
        this._executeCallback('onDragMove', [this.percentage]);
      };
      dragOnStart = function(x, y, e) {
        this._updateDial(x, y);
        this._executeCallback('onDragStart', [this.percentage]);
      };
      dragOnEnd = function(x, y, e) {
        this._executeCallback('onDragEnd', [this.percentage]);
      };

      this._moveKnob(this._convertPercentageToAngle(0));
      this.innerCircle.drag(dragOnMove, dragOnStart, dragOnEnd, this, this, this);
      this.outerCircle.drag(dragOnMove, dragOnStart, dragOnEnd, this, this, this);

      this._executeCallback('onReady');
    },

    buildCanvas: function() {
      return Snap(this.elSelector);
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
        fill: this.c.gradient(this._calculateFillColor(this.options.background)),
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
      var dropShadow = this.c.filter(Snap.filter.shadow(0, this.options.ringWidth / 10, this.options.ringWidth / 10, '#000', 0.6));
      var dialKnob = buildDialKnob.call(this);

      innerCircle = this.c.group(innerCircle, dialKnob).attr({
        fill: this._calculateFillColor(this.options.innerBackground),
        filter: dropShadow,
        transform: ['rotate(0', this.options.frameSize / 2, this.options.frameSize / 2].join(' ')
      });

      return innerCircle;
    },

    buildText: function() {
      return this.c.text(
        this.options.frameSize / 2,
        this.options.frameSize / 2,
        '0%'
      ).attr({
        fontFamily: this.options.textFontFamily,
        fontSize: this.options.textFontSize,
        textAnchor: 'middle'
      });
    },

    _updateText: function(percentage) {
      this.text.attr({
        text: [Math.round(percentage * 100),'%'].join('')
      });
    },

    _calculateFillColor: function(background) {
      background = (background instanceof Array) ? background : [background];
      return 'l(0, 0.5, 1, 0.5)' + background.join('-');
    },

    _convertAngleToPercentage: function(angle) {
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

    _convertPercentageToAngle: function(percentage) {
      var startAngle = 315,
          endAngle = 225;

      unadjustedAngle = (percentage * (endAngle+45)) + startAngle;
      return (unadjustedAngle > 360) ? unadjustedAngle - 360 : unadjustedAngle;
    },

    _moveKnob: function(angle) {
      var dropShadowAlignment = calculateDropShadowAngle(angle);
      var dropShadow = this.c.filter(Snap.filter.shadow(dropShadowAlignment[0], dropShadowAlignment[1], this.options.ringWidth / 10, '#000', 0.6));

      this.innerCircle.attr({
        transform: ['rotate(', angle, this.options.frameSize / 2, this.options.frameSize / 2, ')'].join(' '),
        filter: dropShadow
      });
    },

    _updateDial: function(x, y) {
      var angle = Snap.angle(this.options.frameSize / 2, this.options.frameSize / 2, x, y);

      // if the angle is in the white triangle area, don't do anything
      if (315 >= angle && 225 < angle)
        return

      this._moveKnob(angle);
      this.percentage = this._convertAngleToPercentage(angle);
      this._updateText(this.percentage);
    },

    _executeCallback: function(type, args) {
      if (this.options[type])
        this.options[type].apply(this, args);
    }

  };

  return exports.DialKnob;

}));
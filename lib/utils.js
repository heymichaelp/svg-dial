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
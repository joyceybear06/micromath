module.exports = {
  extends: ["stylelint-config-standard"],
  plugins: ["stylelint-order"],
  rules: {
    "color-hex-case": "lower",
    "string-quotes": "double",
    "font-family-name-quotes": "always-where-recommended",
    "property-no-unknown": true,
    "function-no-unknown": true,
    "selector-pseudo-class-no-unknown": true
  }
};

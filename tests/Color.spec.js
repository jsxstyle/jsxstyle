var Color = require('../lib/Color');
describe('Color', function() {
  it('supports linear gradients', function() {
    expect(Color.linearGradient('to right', [[Color.rgb(255, 255, 255), '5%'], [Color.rgb(255, 0, 0), '25%']])).toBe(
      'linear-gradient(to right, rgb(255, 255, 255) 5%, rgb(255, 0, 0) 25%)'
    );
  });

  it('supports shades', function() {
    expect(Color.shade(Color.rgb(255,255,255), 0.929).toString()).toBe('rgb(237, 237, 237)');
  });
});

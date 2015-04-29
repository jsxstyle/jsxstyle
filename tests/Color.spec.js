var Color = require('../lib/Color');
describe('Color', function() {
  it('works', function() {
    expect(Color.linearGradient('to right', [[Color.rgb(255, 255, 255), '5%'], [Color.rgb(255, 0, 0), '25%']])).toBe(
      'linear-gradient(to right, rgb(255, 255, 255) 5%, rgb(255, 0, 0) 25%)'
    );
  });
});

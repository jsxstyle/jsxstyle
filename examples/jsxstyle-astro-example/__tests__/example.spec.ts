import { expect, test } from '@playwright/test';

test('astro example works', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Astro');

  // const style = await item.evaluate((element) =>
  //   window.getComputedStyle(element)
  // );
});

const id = 'jsxstyle-test';

for (const framework of ['react', 'preact', 'solid']) {
  test(framework + ' example works', async ({ page }) => {
    await page.goto('/' + framework);

    const item = page.locator('#' + id);
    expect(await item.getAttribute('class')).toEqual(
      '_cmecz0 _1mb383g _15ze4s2 _cky7la _pl5woq _1tjz4hu _1qo33y1 _tx589f _4d7esz'
    );
    expect(await item.getAttribute('href')).toEqual('#wow');

    // TODO(meyer) test computed styles
  });
}

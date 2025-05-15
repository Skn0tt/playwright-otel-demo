import { test as baseTest, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

interface TestFixtures {
  span(runnable: () => Promise<void>): Promise<void>;
}

const test = baseTest.extend<TestFixtures>({
    span: async ({ page }, use, testInfo) => {
      const spans: { spanId: string }[] = [];

      await page.route('**', async (route) => {
        await route.continue({
          headers: {
            'X-B3-TraceId': testInfo.testId,
            'X-B3-SpanId': spans[spans.length - 1]?.spanId,
          }
        })
      });

      await use(async (runnable) => {
        const title = runnable.toString();
        await test.step(title, async (step) => {
          const spanId = randomUUID();
          await step.attach('spanId', { body: spanId });
          spans.push({ spanId: spanId });
          await runnable();
          spans.pop();
        });
      });
    }
});

test('demo', async ({ page, span }) => {
  await page.goto('http://localhost:3000/');

  await expect(page.getByRole('main')).toMatchAriaSnapshot(`
    - main:
      - paragraph: "While rendering this page, a span was emitted. Click this button to reload and emit another span:"
      - button "Click me if you can"
  `);

  await span(() =>
    page.getByRole('button', { name: 'Click me if you can' }).click()
  );

  await span(() =>
    page.getByRole('button', { name: 'Click me if you can' }).click()
  );
});

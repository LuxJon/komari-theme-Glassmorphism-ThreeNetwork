import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { installKomariFixture } from './fixtures/komari'

const STABLE_STYLE = `
  *, *::before, *::after {
    animation: none !important;
    caret-color: transparent !important;
    transition: none !important;
  }
  html { scroll-behavior: auto !important; }
  .earth-globe-host canvas,
  .earth-globe-canvas { opacity: 0 !important; }
`

async function openStablePage(page: Page, path = '/'): Promise<void> {
  await page.goto(path)
  await expect(page.getByRole('heading', { name: 'Komari Visual Lab' })).toBeVisible()
  await page.addStyleTag({ content: STABLE_STYLE })
  await page.waitForTimeout(700)
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', await page.locator('html').evaluate(element => element.clientWidth))
}

async function expectNodeMetricIcons(page: Page): Promise<void> {
  for (const metric of ['cpu', 'memory', 'disk', 'traffic'])
    await expect(page.locator(`[data-node-metric-icon="${metric}"]`).first()).toBeVisible()
}

async function expectNodePingBars(page: Page): Promise<void> {
  const card = page.getByRole('button', { name: '查看节点 主控-洛杉矶 详情' })
  for (const metric of ['latency', 'loss']) {
    const bars = card.locator(`[data-node-ping-bars="${metric}"]`)
    await expect(bars).toBeVisible()
    await expect.poll(() => bars.evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThan(0)
  }
}

test('home light desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page)
  await openStablePage(page)
  await expectNodeMetricIcons(page)
  await expectNodePingBars(page)
  const firstCard = page.getByRole('button', { name: '查看节点 主控-洛杉矶 详情' })
  await expect(firstCard.locator('[data-node-tag-color="purple"]')).toHaveText('500Mbps')
  await expect(firstCard.locator('[data-node-tag-color="blue"]')).toHaveText('CN2/9929/CMIN2')
  await expect(firstCard.locator('[data-node-tag-color="teal"]')).toHaveText('Premium Route')
  await expect(page.getByText('全部节点', { exact: true })).toHaveCount(0)

  const regionBar = page.locator('[data-home-region-bar]')
  await expect(regionBar).toBeVisible()
  await expect(regionBar.locator('[data-active="true"]')).toHaveCount(0)
  await expect(regionBar.locator('[data-home-region-code]')).toHaveCount(8)
  await expect(regionBar.locator('[data-home-region-code]').evaluateAll(elements =>
    elements.map(element => element.getAttribute('data-home-region-code')),
  )).resolves.toEqual(['HK', 'TW', 'SG', 'JP', 'US', 'DE', 'GB', 'AU'])
  await expect(regionBar.locator('[data-home-region-code="HK"]')).toHaveAttribute('data-home-region-count', '2')

  const desktopAlignment = await page.locator('[data-general-card-grid], [data-home-primary-filters], [data-home-region-bar]').evaluateAll((elements) => {
    return Object.fromEntries(elements.map((element) => {
      const rect = element.getBoundingClientRect()
      const key = element.hasAttribute('data-general-card-grid')
        ? 'cards'
        : element.hasAttribute('data-home-primary-filters') ? 'primary' : 'regions'
      return [key, { left: rect.left, right: rect.right, width: rect.width }]
    }))
  }) as Record<string, { left: number, right: number, width: number }>
  expect(Math.abs(desktopAlignment.primary.left - desktopAlignment.cards.left)).toBeLessThanOrEqual(1)
  expect(Math.abs(desktopAlignment.primary.right - desktopAlignment.cards.right)).toBeLessThanOrEqual(1)
  expect(Math.abs(desktopAlignment.regions.left - desktopAlignment.cards.left)).toBeLessThanOrEqual(1)
  expect(Math.abs(desktopAlignment.regions.right - desktopAlignment.cards.right)).toBeLessThanOrEqual(1)

  await regionBar.locator('[data-home-region-code="HK"]').click()
  await expect(page.locator('.node-card')).toHaveCount(2)
  await expect(regionBar.locator('[data-home-region-code="HK"]')).toHaveAttribute('data-active', 'true')
  await regionBar.locator('[data-home-region-code="HK"]').click()
  await expect(page.locator('.node-card')).toHaveCount(12)
  await expect(regionBar.locator('[data-active="true"]')).toHaveCount(0)
  await expect(page).toHaveScreenshot('home-light-desktop.png', { fullPage: false })
})

test('home card uses the three-network ping format when three tasks are available', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, {
    threeNetworkPing: true,
    threeNetworkTasks: ['上海移动', '上海联通', '上海电信'],
    hideEarth: true,
  })
  await openStablePage(page)

  const panel = page.locator('[data-node-multi-ping]').first()
  await expect(panel).toBeVisible()
  await expect(panel.locator('[data-node-multi-ping-task]')).toHaveCount(3)
  await expect(panel.locator('[data-node-multi-ping-task]').first()).toHaveAttribute('data-node-multi-ping-task', '上海移动')
  await expect(panel.locator('[data-node-multi-ping-task]').nth(1)).toHaveAttribute('data-node-multi-ping-task', '上海联通')
  await expect(panel.locator('[data-node-multi-ping-task]').nth(2)).toHaveAttribute('data-node-multi-ping-task', '上海电信')
  await expect(panel.locator('[data-latency-tone="5"]')).toBeVisible()
  await expect(panel.locator('[data-latency-tone="3"]')).toBeVisible()
  await expect(panel.locator('[data-latency-tone="2"]')).toBeVisible()
  await expect(panel.locator('[data-node-multi-ping-bars="latency"]')).toHaveCount(3)
  await expect(panel.locator('[data-node-multi-ping-bars="loss"]')).toHaveCount(3)
  await expect(page).toHaveScreenshot('home-three-network-desktop.png', { fullPage: false })
})

test('home dark mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installKomariFixture(page, { dark: true })
  await openStablePage(page)
  await expectNodeMetricIcons(page)

  const primaryFilters = page.locator('[data-home-primary-filters]')
  const regionBar = page.locator('[data-home-region-bar]')
  const viewTools = page.locator('[data-home-view-tools]')
  const mobileOrder = await page.locator('[data-home-primary-filters], [data-home-region-bar], [data-home-view-tools]').evaluateAll((elements) => {
    return Object.fromEntries(elements.map((element) => {
      const rect = element.getBoundingClientRect()
      const key = element.hasAttribute('data-home-primary-filters')
        ? 'primary'
        : element.hasAttribute('data-home-region-bar') ? 'regions' : 'tools'
      return [key, { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }]
    }))
  }) as Record<string, { top: number, bottom: number, left: number, right: number }>
  expect(mobileOrder.primary.bottom).toBeLessThanOrEqual(mobileOrder.regions.top)
  expect(mobileOrder.regions.bottom).toBeLessThanOrEqual(mobileOrder.tools.top)
  expect(Math.abs(mobileOrder.primary.left - mobileOrder.regions.left)).toBeLessThanOrEqual(1)
  expect(Math.abs(mobileOrder.primary.right - mobileOrder.regions.right)).toBeLessThanOrEqual(1)

  const initialScrollState = await regionBar.evaluate(element => ({
    clientWidth: element.clientWidth,
    scrollLeft: element.scrollLeft,
    scrollWidth: element.scrollWidth,
  }))
  expect(initialScrollState.scrollWidth).toBeGreaterThan(initialScrollState.clientWidth)
  expect(initialScrollState.scrollLeft).toBe(0)
  await regionBar.evaluate((element) => {
    element.scrollLeft = element.scrollWidth
  })
  await expect.poll(() => regionBar.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
  await regionBar.evaluate((element) => {
    element.scrollLeft = 0
  })
  await expect(primaryFilters).toBeVisible()
  await expect(viewTools).toBeVisible()
  await expect(page).toHaveScreenshot('home-dark-mobile.png', { fullPage: false })
})

test('home accessible list desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, { colorVisionFriendly: true, viewMode: 'list', hideEarth: true })
  await openStablePage(page)
  await expect(page).toHaveScreenshot('home-accessible-list-desktop.png', { fullPage: false })
})

test('home cobe layout desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, { earthRenderer: 'cobe' })
  await openStablePage(page)
  await expectNodeMetricIcons(page)
  await expect(page.locator('[data-earth-region-summary]')).toHaveCount(0)
  await expect(page.locator('[data-home-region-code="US"]')).toHaveAttribute('data-home-region-count', '2')
  await expect(page.locator('[data-home-region-code="HK"]')).toHaveAttribute('data-home-region-count', '2')
  await expect(page.locator('[data-earth-cluster-count="2"]').first()).toBeAttached()
  await expect(page).toHaveScreenshot('home-cobe-desktop.png', { fullPage: false })
})

test('home region filter keeps every country discoverable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installKomariFixture(page, { earthRenderer: 'cobe' })
  await openStablePage(page)

  const regionBar = page.locator('[data-home-region-bar]')
  await expect(regionBar).toBeVisible()
  await expect(regionBar.locator('[data-home-region-code="US"]')).toHaveAttribute('data-home-region-count', '2')
  await expect(regionBar.locator('[data-home-region-code="HK"]')).toHaveAttribute('data-home-region-count', '2')
  await expect(page.locator('[data-earth-region-summary]')).toHaveCount(0)
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', await page.locator('html').evaluate(element => element.clientWidth))
  await expect(page.locator('[data-earth-cluster-count="2"]').first()).toBeAttached()
})

test('configured Hong Kong region wins over a misclassified IP provider', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installKomariFixture(page, {
    earthRenderer: 'cobe',
    misclassifiedHongKongGeo: true,
  })
  await openStablePage(page)

  const regionBar = page.locator('[data-home-region-bar]')
  await expect(regionBar.locator('[data-home-region-code="US"]')).toHaveAttribute('data-home-region-count', '2')
  await expect(regionBar.locator('[data-home-region-code="HK"]')).toHaveAttribute('data-home-region-count', '2')
})

test('home tiled layout desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, { earthRenderer: 'tiled' })
  await openStablePage(page)
  await expectNodeMetricIcons(page)
  await expect(page).toHaveScreenshot('home-tiled-desktop.png', { fullPage: false })
})

test('home mini card metric icons remain accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installKomariFixture(page, { nodeCardSize: 'mini', hideEarth: true })
  await openStablePage(page)

  const card = page.getByRole('button', { name: '查看节点 主控-洛杉矶 详情' })
  await expect(card.locator('[data-node-metric-icon="cpu"]')).toBeVisible()
  await expect(card.locator('[data-node-metric-icon="memory"]')).toBeVisible()
  await expect(card.locator('[data-node-metric-icon="traffic"]')).toBeVisible()
  await expect(card.getByRole('img', { name: 'CPU' })).toBeVisible()
  await expect(card.getByRole('img', { name: '内存' })).toBeVisible()
})

test('free node pricing stays semantic across home, finance, and detail', async ({ page }) => {
  const freeNodeName = '主控-洛杉矶'
  const freeNodeUuid = '00000000-0000-4000-8000-000000000001'
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, { freePriceNode: true, hideEarth: true })
  await openStablePage(page)

  const nodeCard = page.getByRole('button', { name: `查看节点 ${freeNodeName} 详情` })
  await expect(nodeCard.getByText('免费', { exact: true })).toBeVisible()
  await expect(nodeCard.getByText('无', { exact: true })).toBeVisible()
  await expect(nodeCard.getByText('免费 / 年', { exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: '查看剩余价值明细' }).click()
  const financeDialog = page.getByRole('dialog', { name: '价值与费用明细' })
  await expect(financeDialog.getByText(freeNodeName, { exact: true })).toHaveCount(0)
  await financeDialog.getByLabel('排除免费节点').uncheck()
  const freeNodeRow = financeDialog.getByRole('cell', { name: freeNodeName, exact: true }).locator('..')
  await expect(freeNodeRow).toBeVisible()
  await expect(freeNodeRow.getByText('免费', { exact: true })).toBeVisible()
  await expect(freeNodeRow.getByText('无', { exact: true })).toBeVisible()

  await page.goto(`/instance/${freeNodeUuid}`)
  await expect(page.getByText('硬件信息', { exact: true })).toBeVisible()
  await expect(page.getByText('节点价格', { exact: true })).toBeVisible()
  await expect(page.getByText('剩余价值', { exact: true })).toBeVisible()
  await expect(page.getByText('无', { exact: true })).toBeVisible()
  await expect(page.getByText('免费 / 月', { exact: true })).toHaveCount(0)
})

test('detail light desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page)
  await openStablePage(page, '/instance/00000000-0000-4000-8000-000000000001')
  await expect(page.getByText('硬件信息')).toBeVisible()
  await expect(page).toHaveScreenshot('detail-light-desktop.png', { fullPage: false })
})

test('detail dark mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installKomariFixture(page, { dark: true })
  await openStablePage(page, '/instance/00000000-0000-4000-8000-000000000002')
  await expect(page.getByText('硬件信息')).toBeVisible()
  await expect(page).toHaveScreenshot('detail-dark-mobile.png', { fullPage: false })
})

test('detail ping requests stay scoped to the current node', async ({ page }) => {
  const currentUuid = '00000000-0000-4000-8000-000000000001'
  const metricCalls: Array<{ method: string, params: Record<string, unknown> }> = []
  const isPingMetricCall = (call: { method: string, params: Record<string, unknown> }): boolean => {
    const metricKeys = Array.isArray(call.params.metric_keys) ? call.params.metric_keys : []
    return call.method === 'public:getPingMetricStats'
      || metricKeys.includes('ping.latency_ms')
      || metricKeys.includes('ping.loss')
  }

  page.on('request', (request) => {
    if (!request.url().endsWith('/api/rpc2'))
      return

    const payload = request.postDataJSON() as { method?: string, params?: Record<string, unknown> } | null
    if (payload?.method === 'public:queryMetrics' || payload?.method === 'public:getPingMetricStats') {
      metricCalls.push({ method: payload.method, params: payload.params ?? {} })
    }
  })

  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page)
  await openStablePage(page)

  await expect.poll(() => metricCalls.filter(isPingMetricCall).length).toBeGreaterThan(0)
  const homeSummaryCalls = metricCalls.filter(call => call.method === 'public:queryMetrics' && isPingMetricCall(call))
  expect(homeSummaryCalls.length).toBeGreaterThan(0)
  expect(homeSummaryCalls.every(call => call.params.max_points === 150)).toBe(true)

  metricCalls.length = 0
  await page.getByRole('button', { name: '查看节点 主控-洛杉矶 详情' }).click()
  await expect(page).toHaveURL(`/instance/${currentUuid}`)
  await expect(page.getByText('硬件信息')).toBeVisible()
  await page.waitForTimeout(2_000)

  const detailPingCalls = metricCalls.filter(isPingMetricCall)
  expect(detailPingCalls.length).toBeGreaterThan(0)
  expect(new Set(detailPingCalls.map(call => call.params.entity_id))).toEqual(new Set([currentUuid]))
})

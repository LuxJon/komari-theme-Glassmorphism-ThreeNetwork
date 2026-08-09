import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import { useNodePingStats } from '@/composables/useNodePingStats'
import { PING_SUMMARY_MAX_COUNT } from '@/constants/load'
import { useAppStore } from '@/stores/app'
import { formatDateTime } from '@/utils/helper'

export type NodePingMetric = 'latency' | 'loss'

export interface NodePingBar {
  key: string
  className: string
  tooltip: string
}

export interface NodeMultiPingDisplayLine {
  taskId: number
  taskName: string
  latencyDisplay: string
  lossDisplay: string
  latencyTone: string
  lossTone: string
  latencyToneClass: string
  lossToneClass: string
  latencyBars: NodePingBar[]
  lossBars: NodePingBar[]
  tooltip: string
}

interface UseNodePingDisplayOptions {
  enabled?: MaybeRefOrGetter<boolean>
  loadingDisplayText?: string
  emptyDisplayText?: string
  loadingPanelTooltipText?: Partial<Record<NodePingMetric, string>>
  emptyPanelTooltipText?: Partial<Record<NodePingMetric, string>>
}

const EMPTY_PING_BAR_COUNT = 20

type PingTone = 1 | 2 | 3 | 4 | 5

const PING_BAR_TONE_CLASSES: Record<PingTone, string> = {
  1: 'bg-signal-1',
  2: 'bg-signal-2',
  3: 'bg-signal-3 ping-signal-pattern-2',
  4: 'bg-signal-4 ping-signal-pattern-3',
  5: 'bg-signal-5 ping-signal-pattern-4',
}

const PING_TEXT_TONE_CLASSES: Record<PingTone, string> = {
  1: 'text-signal-1',
  2: 'text-signal-2',
  3: 'text-signal-3',
  4: 'text-signal-4',
  5: 'text-signal-5',
}

function getLatencyTone(latency: number): PingTone {
  if (latency <= 60)
    return 1
  if (latency <= 100)
    return 2
  if (latency <= 160)
    return 3
  if (latency <= 200)
    return 4
  return 5
}

function getLossTone(loss: number): PingTone {
  if (loss <= 1)
    return 1
  if (loss <= 3)
    return 2
  if (loss <= 6)
    return 3
  if (loss <= 9)
    return 4
  return 5
}

export function useNodePingDisplay(
  uuid: MaybeRefOrGetter<string>,
  options: UseNodePingDisplayOptions = {},
) {
  const appStore = useAppStore()

  const pingStatsEnabled = computed(() => {
    if (toValue(options.enabled) === false)
      return false
    if (appStore.publicSettings?.record_enabled === false)
      return false
    return appStore.publicSettings?.ping_record_preserve_time !== 0
  })

  const pingStatsHours = computed(() => {
    const preserveTime = appStore.publicSettings?.ping_record_preserve_time
    if (typeof preserveTime === 'number' && preserveTime > 0)
      return Math.min(preserveTime, 1)
    return 1
  })

  const pingStats = useNodePingStats(uuid, {
    hours: pingStatsHours,
    enabled: pingStatsEnabled,
    maxCount: PING_SUMMARY_MAX_COUNT,
    selectedTasks: () => appStore.threeNetworkPingTaskSelections,
  })

  function buildPingBars(
    points: Array<{ time: string, latency: number | null, loss: number | null }>,
    metric: NodePingMetric,
    keyPrefix: string,
  ): NodePingBar[] {
    if (!points.length)
      return []

    return points.map((point, index) => {
      const value = point[metric]

      return {
        key: `${keyPrefix}-${point.time}-${index}`,
        className: value === null
          ? 'bg-muted-foreground/15'
          : metric === 'latency'
            ? PING_BAR_TONE_CLASSES[getLatencyTone(value)]
            : PING_BAR_TONE_CLASSES[getLossTone(value)],
        tooltip: value === null
          ? `${formatDateTime(point.time, 'HH:mm:ss')}\n无采样数据`
          : metric === 'latency'
            ? `${formatDateTime(point.time, 'HH:mm:ss')}\n${Math.round(value)} ms`
            : `${formatDateTime(point.time, 'HH:mm:ss')}\n${value.toFixed(1)}%`,
      }
    })
  }

  function buildEmptyPingBars(metric: NodePingMetric): NodePingBar[] {
    const tooltip = pingStats.loading.value
      ? '加载中'
      : pingStats.error.value
        ? '加载失败'
        : !pingStatsEnabled.value
            ? '未启用记录'
            : metric === 'latency'
              ? '无采样数据'
              : '无采样数据'

    return Array.from({ length: EMPTY_PING_BAR_COUNT }, (_, index) => ({
      key: `${metric}-empty-${index}`,
      className: 'bg-muted-foreground/10',
      tooltip,
    }))
  }

  const latencyBars = computed(() => buildPingBars(pingStats.history.value, 'latency', 'summary'))
  const lossBars = computed(() => buildPingBars(pingStats.history.value, 'loss', 'summary'))
  const latencyRenderBars = computed(() => latencyBars.value.length ? latencyBars.value : buildEmptyPingBars('latency'))
  const lossRenderBars = computed(() => lossBars.value.length ? lossBars.value : buildEmptyPingBars('loss'))

  const latencyDisplay = computed(() => {
    if (pingStats.hasData.value)
      return `${Math.round(pingStats.avgLatency.value)} ms`
    if (pingStats.loading.value)
      return options.loadingDisplayText ?? '加载中'
    return options.emptyDisplayText ?? '-'
  })

  const lossDisplay = computed(() => {
    if (pingStats.hasData.value)
      return `${pingStats.avgLoss.value.toFixed(1)}%`
    if (pingStats.loading.value)
      return options.loadingDisplayText ?? '加载中'
    return options.emptyDisplayText ?? '-'
  })

  const latencyPanelTooltip = computed(() => {
    if (!pingStats.hasData.value) {
      if (pingStats.loading.value)
        return options.loadingPanelTooltipText?.latency ?? ''
      return options.emptyPanelTooltipText?.latency ?? ''
    }
    return `平均延迟 ${Math.round(pingStats.avgLatency.value)} ms`
  })

  const lossPanelTooltip = computed(() => {
    if (!pingStats.hasData.value) {
      if (pingStats.loading.value)
        return options.loadingPanelTooltipText?.loss ?? ''
      return options.emptyPanelTooltipText?.loss ?? ''
    }

    const volatility = pingStats.avgVolatility.value > 0
      ? `，平均波动 ${pingStats.avgVolatility.value.toFixed(2)}`
      : ''
    return `平均丢包 ${pingStats.avgLoss.value.toFixed(1)}%${volatility}`
  })

  const threeNetworkLines = computed<NodeMultiPingDisplayLine[]>(() => pingStats.threeNetworkStats.value.map((task) => {
    const latencyTone = task.latestLatency === null ? null : getLatencyTone(task.latestLatency)
    const lossTone = task.hasData ? getLossTone(task.avgLoss) : null
    const latencyBars = buildPingBars(task.history, 'latency', `${task.taskId}-latency`)
    const lossBars = buildPingBars(task.history, 'loss', `${task.taskId}-loss`)

    return {
      taskId: task.taskId,
      taskName: task.taskName,
      latencyDisplay: task.latestLatency === null ? '-' : `${Math.round(task.latestLatency)} ms`,
      lossDisplay: task.hasData ? `${task.avgLoss.toFixed(1)}%` : '-',
      latencyTone: latencyTone === null ? 'empty' : String(latencyTone),
      lossTone: lossTone === null ? 'empty' : String(lossTone),
      latencyToneClass: latencyTone === null ? 'text-muted-foreground' : PING_TEXT_TONE_CLASSES[latencyTone],
      lossToneClass: lossTone === null ? 'text-muted-foreground' : PING_TEXT_TONE_CLASSES[lossTone],
      latencyBars: latencyBars.length ? latencyBars : buildEmptyPingBars('latency'),
      lossBars: lossBars.length ? lossBars : buildEmptyPingBars('loss'),
      tooltip: `${task.taskName}\n延迟 ${task.latestLatency === null ? '无样本' : `${Math.round(task.latestLatency)} ms`}\n丢包 ${task.hasData ? `${task.avgLoss.toFixed(1)}%` : '无样本'}`,
    }
  }))

  return {
    pingStats,
    pingStatsEnabled,
    pingStatsHours,
    latencyRenderBars,
    lossRenderBars,
    latencyDisplay,
    lossDisplay,
    latencyPanelTooltip,
    lossPanelTooltip,
    threeNetworkLines,
  }
}

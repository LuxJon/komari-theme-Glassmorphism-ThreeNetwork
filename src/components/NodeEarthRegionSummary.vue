<script setup lang="ts">
import type { RegionCluster } from '@/composables/useNodeGeoClusters'
import { computed } from 'vue'
import { getRegionDisplayName } from '@/utils/regionHelper'

const props = defineProps<{
  clusters: RegionCluster[]
}>()

interface CountrySummary {
  code: string
  label: string
  servers: number
  onlineServers: number
  nodeNames: string[]
}

const countrySummaries = computed<CountrySummary[]>(() => {
  const summaries = new Map<string, CountrySummary>()

  for (const cluster of props.clusters) {
    const code = cluster.code.toUpperCase() || 'XX'
    const current = summaries.get(code) ?? {
      code,
      label: getRegionDisplayName(code) || code,
      servers: 0,
      onlineServers: 0,
      nodeNames: [],
    }
    current.servers += cluster.servers
    current.onlineServers += cluster.onlineServers
    current.nodeNames.push(...cluster.nodeNames)
    summaries.set(code, current)
  }

  return Array.from(summaries.values()).sort((left, right) =>
    right.servers - left.servers || left.code.localeCompare(right.code),
  )
})

const summaryLabel = computed(() => countrySummaries.value
  .map(summary => `${summary.label} ${summary.servers} 台`)
  .join('，'))
</script>

<template>
  <div
    v-if="countrySummaries.length > 0"
    data-earth-region-summary
    class="absolute top-14 md:top-20 left-0 z-10 flex max-w-[92%] flex-wrap items-center gap-1 rounded-md bg-background/78 px-1.5 py-1 text-[9px] text-muted-foreground shadow-sm ring-1 ring-border/50 backdrop-blur-md pointer-events-none"
    role="status"
    :aria-label="`服务器地区分布：${summaryLabel}`"
  >
    <span
      v-for="summary in countrySummaries"
      :key="summary.code"
      :data-earth-region-code="summary.code"
      class="inline-flex min-w-0 items-center gap-1 whitespace-nowrap rounded bg-slate-500/[0.08] px-1 py-0.5"
      :title="`${summary.label} · ${summary.servers} 台（在线 ${summary.onlineServers} 台）\n${summary.nodeNames.join('\n')}`"
    >
      <img
        v-if="summary.code !== 'XX'"
        :src="`/images/flags/${summary.code}.svg`"
        :alt="summary.label"
        class="size-3 rounded-[1px] object-cover"
      >
      <span class="max-w-20 truncate">{{ summary.label }}</span>
      <strong class="tabular-nums text-foreground/80">×{{ summary.servers }}</strong>
    </span>
  </div>
</template>

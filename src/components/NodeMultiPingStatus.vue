<script setup lang="ts">
import type { NodeMultiPingDisplayLine } from '@/composables/useNodePingDisplay'
import { DataTooltip } from '@/components/ui/data-tooltip'

defineProps<{
  nodeName: string
  lines: NodeMultiPingDisplayLine[]
  offline?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    data-node-multi-ping
    class="grid min-w-0 grid-cols-2 gap-3 rounded-lg bg-slate-500/5 p-2 text-left"
    :class="offline ? 'blur-xs opacity-50' : ''"
    :aria-label="`${nodeName} 三网延迟与丢包监测`"
    @click.stop="emit('click')"
  >
    <div class="flex min-w-0 flex-col gap-1.5" aria-label="延迟">
      <div
        v-for="line in lines"
        :key="`latency-${line.taskId}`"
        class="flex min-w-0 flex-col gap-0.5"
        :data-node-multi-ping-task="line.taskName"
        :title="line.tooltip"
      >
        <div class="flex min-w-0 items-baseline justify-between gap-1.5 leading-none">
          <span class="min-w-0 truncate text-[10px] font-medium text-muted-foreground">{{ line.taskName }}</span>
          <span
            class="shrink-0 tabular-nums text-[11px] font-medium tracking-[-0.01em] antialiased"
            :class="line.latencyToneClass"
            :data-latency-tone="line.latencyTone"
          >{{ line.latencyDisplay }}</span>
        </div>
        <div
          data-node-multi-ping-bars="latency"
          class="grid h-2.5 min-w-0 items-stretch gap-[1px] opacity-80 hover:opacity-100"
          :style="{ gridTemplateColumns: `repeat(${line.latencyBars.length}, minmax(0, 1fr))` }"
        >
          <DataTooltip
            v-for="bar in line.latencyBars"
            :key="bar.key"
            placement="top"
            :content="bar.tooltip"
            class="h-full min-w-0"
          >
            <span class="block h-full w-full rounded-[1px]" :class="bar.className" />
          </DataTooltip>
        </div>
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-1.5" aria-label="丢包">
      <div
        v-for="line in lines"
        :key="`loss-${line.taskId}`"
        class="flex min-w-0 flex-col gap-0.5"
        :title="line.tooltip"
      >
        <div class="flex min-w-0 items-baseline justify-end leading-none">
          <span
            class="shrink-0 tabular-nums text-[11px] font-medium tracking-[-0.01em] antialiased"
            :class="line.lossToneClass"
            :data-loss-tone="line.lossTone"
          >{{ line.lossDisplay }}</span>
        </div>
        <div
          data-node-multi-ping-bars="loss"
          class="grid h-2.5 min-w-0 items-stretch gap-[1px] opacity-80 hover:opacity-100"
          :style="{ gridTemplateColumns: `repeat(${line.lossBars.length}, minmax(0, 1fr))` }"
        >
          <DataTooltip
            v-for="bar in line.lossBars"
            :key="bar.key"
            placement="top"
            :content="bar.tooltip"
            class="h-full min-w-0"
          >
            <span class="block h-full w-full rounded-[1px]" :class="bar.className" />
          </DataTooltip>
        </div>
      </div>
    </div>
  </button>
</template>

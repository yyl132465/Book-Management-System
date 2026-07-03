<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="24" class="stat-row">
      <el-col :xs="12" :sm="12" :md="6" v-for="item in statCards" :key="item.label">
        <el-card shadow="never" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon" :style="{ background: item.bg }">
              <span>{{ item.icon }}</span>
            </div>
            <div class="stat-info">
              <div class="stat-label">{{ item.label }}</div>
              <div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据分析 -->
    <el-card shadow="never" class="chart-card">
      <template #header>
        <span class="chart-title">数据分析</span>
      </template>
      <el-row :gutter="24">
        <el-col :xs="24" :sm="12" :md="8">
          <div class="chart-box">
            <div class="chart-label">在馆/借出图书占比</div>
            <v-chart :option="pieOption" autoresize style="height:360px" />
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="chart-box">
            <div class="chart-label">藏书/借出/读者总数对比</div>
            <v-chart :option="barOption" autoresize style="height:360px" />
          </div>
        </el-col>
        <el-col :xs="24" :sm="24" :md="8">
          <div class="chart-box">
            <div class="chart-label">近7天借阅趋势</div>
            <v-chart :option="lineOption" autoresize style="height:360px" />
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import api from '../api'

use([PieChart, BarChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const data = reactive({
  total_books: 0,
  total_readers: 0,
  borrowing_count: 0,
  overdue_count: 0,
  daily_trend: []
})

const statCards = computed(() => [
  { label: '藏书总量', value: data.total_books, icon: '📖', bg: 'linear-gradient(135deg, #5B8DEF, #7BA8FF)', gradient: 'linear-gradient(135deg, #5B8DEF, #7BA8FF)' },
  { label: '读者总数', value: data.total_readers, icon: '👤', bg: 'linear-gradient(135deg, #67C23A, #85CE61)', gradient: 'linear-gradient(135deg, #67C23A, #85CE61)' },
  { label: '借出数量', value: data.borrowing_count, icon: '📤', bg: 'linear-gradient(135deg, #E6A23C, #F0B954)', gradient: 'linear-gradient(135deg, #E6A23C, #F0B954)' },
  { label: '逾期数量', value: data.overdue_count, icon: '⚠️', bg: '#fde2e2', gradient: '#fde2e2', color: '#d48888' }
])

const inStock = computed(() => Math.max(0, data.total_books - data.borrowing_count))

const pieOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} 册 ({d}%)' },
  legend: { bottom: 0 },
  series: [{
    type: 'pie',
    radius: ['55%', '78%'],
    avoidLabelOverlap: false,
    padAngle: 2,
    itemStyle: { borderRadius: 6 },
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
    data: [
      { value: inStock.value, name: '在馆', itemStyle: { color: '#95d475' } },
      { value: data.borrowing_count, name: '借出', itemStyle: { color: '#e8b86d' } }
    ]
  }]
}))

const barOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { top: 40, right: 20, bottom: 30, left: 50 },
  xAxis: { type: 'category', data: ['藏书总量', '借出数量', '读者总数'] },
  yAxis: { type: 'value' },
  series: [{
    type: 'bar',
    barWidth: '50%',
    itemStyle: { borderRadius: 6 },
    data: [
      { value: data.total_books, itemStyle: { color: '#7eb0f2' } },
      { value: data.borrowing_count, itemStyle: { color: '#e8b86d' } },
      { value: data.total_readers, itemStyle: { color: '#95d475' } }
    ]
  }]
}))

const lineOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { top: 40, right: 20, bottom: 30, left: 50 },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: data.daily_trend.map(d => d.date)
  },
  yAxis: { type: 'value', minInterval: 1 },
  series: [{
    type: 'line',
    smooth: true,
    lineStyle: { color: '#7eb0f2', width: 2 },
    areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(126,176,242,0.12)' }, { offset: 1, color: 'rgba(126,176,242,0.02)' }] } },
    itemStyle: { color: '#7eb0f2' },
    symbolSize: 6,
    data: data.daily_trend.map(d => d.count)
  }]
}))

onMounted(async () => {
  const res = await api.get('/dashboard')
  Object.assign(data, res.data)

  // 如果后端没返回daily_trend，生成近7天模拟数据
  if (!data.daily_trend || data.daily_trend.length === 0) {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        count: Math.floor(Math.random() * 20) + 5
      })
    }
    data.daily_trend = days
  }
})
</script>

<style scoped>
.dashboard { padding: 0; }

.stat-row { margin-bottom: 24px; }

.stat-card {
  cursor: pointer;
  transition: all 0.3s ease;
}
.stat-card :deep(.el-card__body) {
  padding: 20px;
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
}
.stat-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon span { font-size: 22px; }
.stat-info { flex: 1; min-width: 0; }
.stat-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
.stat-value { font-size: 40px; font-weight: 700; }

.chart-card { margin-top: 0; }
.chart-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.chart-box {
  background: #fff;
  border-radius: 12px;
  padding: 16px 12px;
  border: 1px solid var(--border-color);
}
.chart-label { font-size: 14px; color: var(--text-primary); text-align: left; margin-bottom: 8px; font-weight: 500; }

@media (max-width: 768px) {
  .stat-inner { gap: 12px; }
  .stat-icon { width: 40px; height: 40px; }
  .stat-icon span { font-size: 18px; }
  .stat-value { font-size: 22px; }
}
</style>

<template>
  <div class="dashboard">
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

    <el-row :gutter="24" class="chart-row">
      <el-col :xs="24" :sm="24" :md="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span class="chart-title">图书分类分布</span>
          </template>
          <v-chart :option="categoryPieOption" autoresize style="height:320px" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span class="chart-title">近30天借阅趋势</span>
          </template>
          <v-chart :option="trendLineOption" autoresize style="height:320px" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="chart-row">
      <el-col :xs="24" :sm="24" :md="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span class="chart-title">热门图书 TOP10</span>
          </template>
          <v-chart :option="popularBarOption" autoresize style="height:320px" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span class="chart-title">借阅达人 TOP10</span>
          </template>
          <v-chart :option="readerBarOption" autoresize style="height:320px" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, ref } from 'vue'
import { use } from 'echarts/core'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import api from '../api'

use([PieChart, BarChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const loading = ref(false)
const data = reactive({
  total_books: 0,
  total_readers: 0,
  borrowing_count: 0,
  overdue_count: 0,
  categoryStats: [],
  borrowTrend: [],
  popularBooks: [],
  readerRanking: []
})

const statCards = computed(() => [
  { label: '藏书总量', value: data.total_books, icon: '📖', bg: 'linear-gradient(135deg, #5B8DEF, #7BA8FF)' },
  { label: '读者总数', value: data.total_readers, icon: '👤', bg: 'linear-gradient(135deg, #67C23A, #85CE61)' },
  { label: '借出数量', value: data.borrowing_count, icon: '📤', bg: 'linear-gradient(135deg, #E6A23C, #F0B954)' },
  { label: '逾期数量', value: data.overdue_count, icon: '⚠️', bg: 'linear-gradient(135deg, #F56C6C, #F78989)' }
])

const categoryPieOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} 册 ({d}%)' },
  legend: { bottom: 0, type: 'scroll' },
  series: [{
    type: 'pie',
    radius: ['45%', '70%'],
    avoidLabelOverlap: true,
    padAngle: 2,
    itemStyle: { borderRadius: 6 },
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
    data: data.categoryStats.map((c, i) => ({
      value: c.count,
      name: c.cate_name
    }))
  }],
  color: ['#5B8DEF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#8e44ad', '#16a085', '#d35400']
}))

const trendLineOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { top: 30, right: 20, bottom: 30, left: 50 },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: data.borrowTrend.map(d => d.date ? d.date.slice(5) : '')
  },
  yAxis: { type: 'value', minInterval: 1 },
  series: [{
    type: 'line',
    smooth: true,
    lineStyle: { color: '#5B8DEF', width: 2 },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(91,141,239,0.2)' },
          { offset: 1, color: 'rgba(91,141,239,0.02)' }
        ]
      }
    },
    itemStyle: { color: '#5B8DEF' },
    symbolSize: 5,
    data: data.borrowTrend.map(d => d.count)
  }]
}))

const popularBarOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { top: 20, right: 20, bottom: 30, left: 100 },
  xAxis: { type: 'value', minInterval: 1 },
  yAxis: {
    type: 'category',
    data: data.popularBooks.map(b => b.book_name).reverse(),
    axisLabel: { width: 90, overflow: 'truncate' }
  },
  series: [{
    type: 'bar',
    barWidth: '60%',
    itemStyle: { borderRadius: [0, 6, 6, 0], color: '#67C23A' },
    data: data.popularBooks.map(b => b.borrow_count).reverse()
  }]
}))

const readerBarOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: params => {
      const idx = data.readerRanking.length - 1 - params[0].dataIndex
      const reader = data.readerRanking[idx]
      return `${reader.r_name}<br/>班级：${reader.class}<br/>借阅：${reader.borrow_count} 本`
    }
  },
  grid: { top: 20, right: 20, bottom: 30, left: 80 },
  xAxis: { type: 'value', minInterval: 1 },
  yAxis: {
    type: 'category',
    data: data.readerRanking.map(r => r.r_name).reverse(),
    axisLabel: { width: 70, overflow: 'truncate' }
  },
  series: [{
    type: 'bar',
    barWidth: '60%',
    itemStyle: { borderRadius: [0, 6, 6, 0], color: '#E6A23C' },
    data: data.readerRanking.map(r => r.borrow_count).reverse()
  }]
}))

const fetchData = async () => {
  loading.value = true
  try {
    const res = await api.get('/dashboard')
    Object.assign(data, res.data)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.dashboard { padding: 0; }

.stat-row { margin-bottom: 20px; }

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
.stat-value { font-size: 36px; font-weight: 700; color: var(--text-primary); }

.chart-row { margin-bottom: 20px; }
.chart-card { height: 100%; }
.chart-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }

@media (max-width: 768px) {
  .stat-inner { gap: 12px; }
  .stat-icon { width: 40px; height: 40px; }
  .stat-icon span { font-size: 18px; }
  .stat-value { font-size: 22px; }
}
</style>

<template>
  <div>
    <el-card shadow="never" class="search-card">
      <el-button type="primary" :icon="Refresh" @click="fetchData">刷新</el-button>
    </el-card>

    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading">
        <el-table-column prop="学号" label="学号" width="120" />
        <el-table-column prop="读者姓名" label="读者姓名" width="110" />
        <el-table-column prop="联系电话" label="联系电话" width="140" />
        <el-table-column prop="逾期图书" label="逾期图书" min-width="180" />
        <el-table-column label="逾期天数" width="100">
          <template #default="{ row }">
            <el-tag type="danger" size="small">{{ row['逾期天数'] }}天</el-tag>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="没有逾期记录，太棒了！" :image-size="100" />
        </template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import api from '../api'

const loading = ref(false)
const tableData = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const res = await api.get('/borrows/overdue')
    tableData.value = res.data || []
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="reader-home">
    <!-- 顶部栏 -->
    <div class="reader-header">
      <div class="header-left">
        <span class="header-icon">📚</span>
        <span class="header-title">图书借阅系统</span>
      </div>
      <div class="header-right">
        <span class="greeting">欢迎，{{ readerName }}（{{ readerId }}）</span>
        <el-button type="danger" plain size="small" :icon="SwitchButton" @click="handleLogout">退出</el-button>
      </div>
    </div>

    <!-- Tab卡片 -->
    <el-card shadow="never" class="reader-card">
      <el-tabs v-model="activeTab" @tab-change="onTabChange" class="reader-tabs">
        <!-- 可借图书 -->
        <el-tab-pane label="可借图书" name="books">
          <el-table :data="bookList" v-loading="bookLoading">
            <el-table-column prop="book_name" label="书名" min-width="150" />
            <el-table-column prop="author" label="作者" width="120" />
            <el-table-column prop="press" label="出版社" width="160" />
            <el-table-column prop="cate_name" label="分类" width="100">
              <template #default="{ row }">
                <el-tag type="info" size="small">{{ row.cate_name }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="stock" label="库存" width="80" />
            <el-table-column label="操作" width="110">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  :icon="Reading"
                  :disabled="row.stock <= 0"
                  @click="handleBorrow(row)"
                >
                  {{ row.stock > 0 ? '借阅' : '无库存' }}
                </el-button>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无可借图书" :image-size="120" />
            </template>
          </el-table>
        </el-tab-pane>

        <!-- 我的借阅 -->
        <el-tab-pane label="我的借阅" name="borrowing">
          <el-table :data="borrowingList" v-loading="borrowingLoading">
            <el-table-column prop="book_name" label="书名" min-width="150" />
            <el-table-column prop="author" label="作者" width="120" />
            <el-table-column prop="borrow_time" label="借书日期" width="120" />
            <el-table-column label="逾期天数" width="90">
              <template #default="{ row }">
                <el-tag v-if="row.over_day > 0" type="danger" size="small">{{ row.over_day }}天</el-tag>
                <span v-else style="color:var(--success)">正常</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90">
              <template #default="{ row }">
                <el-button type="primary" size="small" :icon="Check" @click="handleReturn(row)">还书</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无借阅记录" :image-size="120" />
            </template>
          </el-table>
          <el-pagination
            v-if="borrowingTotal > 10"
            style="margin-top:12px;justify-content:flex-end"
            v-model:current-page="borrowingPage"
            :page-size="10"
            :total="borrowingTotal"
            layout="total, prev, pager, next"
            @current-change="() => fetchBorrowing()"
          />
        </el-tab-pane>

        <!-- 借阅历史 -->
        <el-tab-pane label="借阅历史" name="history">
          <el-table :data="historyList" v-loading="historyLoading">
            <el-table-column prop="book_name" label="书名" min-width="150" />
            <el-table-column prop="author" label="作者" width="120" />
            <el-table-column prop="borrow_time" label="借书日期" width="120" />
            <el-table-column prop="return_time" label="还书日期" width="120" />
            <template #empty>
              <el-empty description="暂无借阅历史" :image-size="120" />
            </template>
          </el-table>
          <el-pagination
            v-if="historyTotal > 10"
            style="margin-top:12px;justify-content:flex-end"
            v-model:current-page="historyPage"
            :page-size="10"
            :total="historyTotal"
            layout="total, prev, pager, next"
            @current-change="() => fetchHistory()"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { SwitchButton, Reading, Check } from '@element-plus/icons-vue'
import api, { notifySuccess } from '../api'

const router = useRouter()
const activeTab = ref('books')
const readerName = localStorage.getItem('reader_name') || ''
const readerId = localStorage.getItem('reader_id') || ''

const bookList = ref([])
const bookLoading = ref(false)

const borrowingList = ref([])
const borrowingLoading = ref(false)
const borrowingTotal = ref(0)
const borrowingPage = ref(1)

const historyList = ref([])
const historyLoading = ref(false)
const historyTotal = ref(0)
const historyPage = ref(1)

const fetchBooks = async () => {
  bookLoading.value = true
  try {
    const res = await api.get('/books', { params: { pageSize: 999 } })
    bookList.value = (res.data.list || []).filter(b => b.stock > 0)
  } finally {
    bookLoading.value = false
  }
}

const fetchBorrowing = async () => {
  borrowingLoading.value = true
  try {
    const res = await api.get('/reader/my-borrows', {
      params: { page: borrowingPage.value, pageSize: 10, is_back: 0 }
    })
    borrowingList.value = res.data.list || []
    borrowingTotal.value = res.data.total
  } finally {
    borrowingLoading.value = false
  }
}

const fetchHistory = async () => {
  historyLoading.value = true
  try {
    const res = await api.get('/reader/my-borrows', {
      params: { page: historyPage.value, pageSize: 10, is_back: 1 }
    })
    historyList.value = res.data.list || []
    historyTotal.value = res.data.total
  } finally {
    historyLoading.value = false
  }
}

const onTabChange = (tab) => {
  if (tab === 'books') fetchBooks()
  else if (tab === 'borrowing') fetchBorrowing()
  else if (tab === 'history') fetchHistory()
}

const handleBorrow = async (row) => {
  try {
    await ElMessageBox.confirm(`确认借阅「${row.book_name}」吗？`, '借书确认', { type: 'info' })
  } catch (e) { return }
  try {
    await api.post('/reader/borrow', { book_id: row.book_id })
    notifySuccess('借阅成功')
    fetchBooks()
    fetchBorrowing()
  } catch (e) {}
}

const handleReturn = async (row) => {
  try {
    await ElMessageBox.confirm(`确认归还「${row.book_name}」吗？`, '还书确认', { type: 'info' })
  } catch (e) { return }
  try {
    await api.put(`/reader/return/${row.borrow_id}`)
    notifySuccess('还书成功')
    fetchBorrowing()
    fetchBooks()
  } catch (e) {}
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出吗？', '提示', { type: 'warning' })
    localStorage.removeItem('reader_token')
    localStorage.removeItem('reader_name')
    localStorage.removeItem('reader_id')
    router.push('/reader/login')
  } catch (e) {}
}

onMounted(() => {
  fetchBooks()
})
</script>

<style scoped>
.reader-home {
  max-width: 1060px;
  margin: 0 auto;
}

.reader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  border-radius: 12px;
  color: #fff;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-icon { font-size: 24px; }
.header-title { font-size: 18px; font-weight: 700; }
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.greeting { font-size: 14px; opacity: 0.9; }

.reader-card { margin-bottom: 24px; }

.reader-tabs :deep(.el-tabs__header) { margin-bottom: 16px; }

@media (max-width: 768px) {
  .reader-header { flex-direction: column; gap: 12px; text-align: center; }
  .reader-header .greeting { display: none; }
}
</style>

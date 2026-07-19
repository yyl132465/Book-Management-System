<template>
  <div class="reader-home">
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

    <el-card shadow="never" class="reader-card">
      <el-tabs v-model="activeTab" @tab-change="onTabChange" class="reader-tabs">
        <el-tab-pane label="可借图书" name="books">
          <div class="search-bar">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索书名或作者"
              clearable
              :prefix-icon="Search"
              style="width:260px;margin-right:12px"
              @keyup.enter="fetchBooks"
              @clear="fetchBooks"
            />
            <el-select
              v-model="searchCate"
              placeholder="按分类筛选"
              clearable
              style="width:180px;margin-right:12px"
              @change="fetchBooks"
            >
              <el-option
                v-for="c in categories"
                :key="c.cate_id"
                :label="c.cate_name"
                :value="c.cate_id"
              />
            </el-select>
            <el-button type="primary" :icon="Search" @click="fetchBooks">搜索</el-button>
          </div>
          <el-table :data="bookList" v-loading="bookLoading" style="margin-top:12px">
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
              <el-empty description="暂无符合条件的图书" :image-size="120" />
            </template>
          </el-table>
          <el-pagination
            v-if="bookTotal > 10"
            style="margin-top:12px;justify-content:flex-end"
            v-model:current-page="bookPage"
            :page-size="10"
            :total="bookTotal"
            layout="total, prev, pager, next"
            @current-change="fetchBooks"
          />
        </el-tab-pane>

        <el-tab-pane label="我的借阅" name="borrowing">
          <el-table :data="borrowingList" v-loading="borrowingLoading">
            <el-table-column prop="book_name" label="书名" min-width="150" />
            <el-table-column prop="author" label="作者" width="100" />
            <el-table-column prop="borrow_time" label="借书日期" width="110" />
            <el-table-column prop="due_date" label="应还日期" width="110" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="isOverdue(row)" type="danger" size="small">已逾期</el-tag>
                <el-tag v-else type="success" size="small">借阅中</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="续借" width="80">
              <template #default="{ row }">
                <span v-if="row.renew_count >= 2" style="color:var(--text-secondary);font-size:12px">已续借{{ row.renew_count }}次</span>
                <el-button v-else type="warning" link size="small" @click="handleRenew(row)">
                  续借({{ 2 - (row.renew_count || 0) }}次)
                </el-button>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
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
            @current-change="fetchBorrowing"
          />
        </el-tab-pane>

        <el-tab-pane label="借阅历史" name="history">
          <el-table :data="historyList" v-loading="historyLoading">
            <el-table-column prop="book_name" label="书名" min-width="150" />
            <el-table-column prop="author" label="作者" width="100" />
            <el-table-column prop="borrow_time" label="借书日期" width="110" />
            <el-table-column prop="due_date" label="应还日期" width="110" />
            <el-table-column prop="return_time" label="还书日期" width="110" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag v-if="row.over_day > 0" type="danger" size="small">逾期{{ row.over_day }}天</el-tag>
                <el-tag v-else type="success" size="small">已归还</el-tag>
              </template>
            </el-table-column>
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
            @current-change="fetchHistory"
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
import { SwitchButton, Reading, Check, Search } from '@element-plus/icons-vue'
import { readerApi, notifySuccess } from '../api'

const router = useRouter()
const activeTab = ref('books')
const readerName = sessionStorage.getItem('reader_name') || ''
const readerId = sessionStorage.getItem('reader_id') || ''

const categories = ref([])
const searchKeyword = ref('')
const searchCate = ref('')
const bookList = ref([])
const bookLoading = ref(false)
const bookTotal = ref(0)
const bookPage = ref(1)

const borrowingList = ref([])
const borrowingLoading = ref(false)
const borrowingTotal = ref(0)
const borrowingPage = ref(1)

const historyList = ref([])
const historyLoading = ref(false)
const historyTotal = ref(0)
const historyPage = ref(1)

const isOverdue = (row) => {
  if (!row.due_date || row.is_back === 1) return false
  const today = new Date().toISOString().slice(0, 10)
  return row.due_date < today
}

const fetchCategories = async () => {
  try {
    const res = await readerApi.get('/categories')
    categories.value = res.data || []
  } catch (e) {}
}

const fetchBooks = async () => {
  bookLoading.value = true
  try {
    const params = { page: bookPage.value, pageSize: 10 }
    if (searchKeyword.value) {
      params.book_name = searchKeyword.value
    }
    if (searchCate.value) {
      params.cate_id = searchCate.value
    }
    const res = await readerApi.get('/books', { params })
    bookList.value = res.data.list || []
    bookTotal.value = res.data.total || 0
  } finally {
    bookLoading.value = false
  }
}

const fetchBorrowing = async () => {
  borrowingLoading.value = true
  try {
    const res = await readerApi.get('/reader/my-borrows', {
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
    const res = await readerApi.get('/reader/my-borrows', {
      params: { page: historyPage.value, pageSize: 10, is_back: 1 }
    })
    historyList.value = res.data.list || []
    historyTotal.value = res.data.total
  } finally {
    historyLoading.value = false
  }
}

const onTabChange = (tab) => {
  if (tab === 'books') {
    if (categories.value.length === 0) fetchCategories()
    fetchBooks()
  }
  else if (tab === 'borrowing') fetchBorrowing()
  else if (tab === 'history') fetchHistory()
}

const handleBorrow = async (row) => {
  try {
    await ElMessageBox.confirm(`确认借阅「${row.book_name}」吗？`, '借书确认', { type: 'info' })
  } catch (e) { return }
  try {
    await readerApi.post('/reader/borrow', { book_id: row.book_id })
    notifySuccess('借阅成功')
    fetchBooks()
  } catch (e) {}
}

const handleReturn = async (row) => {
  try {
    await ElMessageBox.confirm(`确认归还「${row.book_name}」吗？`, '还书确认', { type: 'info' })
  } catch (e) { return }
  try {
    const res = await readerApi.put(`/reader/return/${row.borrow_id}`)
    let msg = '还书成功'
    if (res.data?.over_day > 0) {
      msg = `还书成功，逾期 ${res.data.over_day} 天`
    }
    notifySuccess(msg)
    fetchBorrowing()
    fetchBooks()
  } catch (e) {}
}

const handleRenew = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认续借「${row.book_name}」吗？续借后到期日将延长30天。`,
      '续借确认',
      { type: 'warning' }
    )
  } catch (e) { return }
  try {
    await readerApi.put(`/reader/renew/${row.borrow_id}`)
    notifySuccess('续借成功')
    fetchBorrowing()
  } catch (e) {}
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出吗？', '提示', { type: 'warning' })
    sessionStorage.removeItem('reader_token')
    sessionStorage.removeItem('reader_name')
    sessionStorage.removeItem('reader_id')
    router.push('/reader/login')
  } catch (e) {}
}

onMounted(() => {
  fetchCategories()
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

.search-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.reader-card { margin-bottom: 24px; }

.reader-tabs :deep(.el-tabs__header) { margin-bottom: 16px; }

@media (max-width: 768px) {
  .reader-header { flex-direction: column; gap: 12px; text-align: center; }
  .reader-header .greeting { display: none; }
  .search-bar { flex-direction: column; align-items: stretch; }
  .search-bar .el-input,
  .search-bar .el-select { width: 100% !important; margin-right: 0 !important; }
}
</style>

<template>
  <div>
    <el-card shadow="never" class="search-card">
      <el-form :inline="true">
        <el-form-item>
          <el-input v-model="search.book_name" placeholder="图书名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-input v-model="search.reader_name" placeholder="读者姓名" clearable />
        </el-form-item>
        <el-form-item>
          <el-select v-model="search.is_back" placeholder="归还状态" clearable style="width:120px">
            <el-option label="未还" :value="0" />
            <el-option label="已还" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchData">搜索</el-button>
          <el-button type="success" :icon="Plus" @click="handleBorrow">借书</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading">
        <el-table-column prop="borrow_id" label="流水号" width="80" />
        <el-table-column prop="book_name" label="图书名称" min-width="140" />
        <el-table-column prop="reader_name" label="读者姓名" width="100" />
        <el-table-column prop="reader_class" label="班级" width="120" />
        <el-table-column prop="borrow_time" label="借书日期" width="120" />
        <el-table-column prop="return_time" label="还书日期" width="120">
          <template #default="{ row }">
            {{ row.return_time || '未还' }}
          </template>
        </el-table-column>
        <el-table-column label="逾期天数" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.over_day > 0" type="danger" size="small">{{ row.over_day }}天</el-tag>
            <span v-else>0</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_back === 1 ? 'success' : 'warning'" size="small">
              {{ row.is_back === 1 ? '已还' : '未还' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.is_back === 0"
              type="primary"
              size="small"
              :icon="Check"
              @click="handleReturn(row)"
            >还书</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无借阅记录" :image-size="100" />
        </template>
      </el-table>

      <el-pagination
        style="margin-top:16px;justify-content:flex-end"
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @current-change="fetchData"
        @size-change="fetchData"
      />
    </el-card>

    <!-- 借书弹窗 -->
    <el-dialog title="借书" v-model="borrowDialogVisible" width="480px">
      <el-form :model="borrowForm" :rules="borrowRules" ref="borrowFormRef" label-width="80px">
        <el-form-item label="读者" prop="reader_id">
          <el-select v-model="borrowForm.reader_id" filterable placeholder="搜索读者姓名" style="width:100%">
            <el-option v-for="r in readerOptions" :key="r.reader_id" :label="`${r.r_name} - ${r.reader_id} (${r.class})`" :value="r.reader_id" />
          </el-select>
        </el-form-item>
        <el-form-item label="图书" prop="book_id">
          <el-select v-model="borrowForm.book_id" filterable placeholder="搜索图书名称" style="width:100%">
            <el-option v-for="b in bookOptions" :key="b.book_id" :label="`${b.book_name} - ${b.book_id} (库存:${b.stock})`" :value="b.book_id" :disabled="b.stock <= 0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="borrowDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBorrow">确定借阅</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Check } from '@element-plus/icons-vue'
import api, { notifySuccess } from '../api'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const search = reactive({ book_name: '', reader_name: '', is_back: '' })

const borrowDialogVisible = ref(false)
const borrowFormRef = ref(null)
const borrowForm = reactive({ reader_id: '', book_id: '' })
const borrowRules = {
  reader_id: [{ required: true, message: '请选择读者', trigger: 'change' }],
  book_id: [{ required: true, message: '请选择图书', trigger: 'change' }]
}
const readerOptions = ref([])
const bookOptions = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (search.book_name) params.book_name = search.book_name
    if (search.reader_name) params.reader_name = search.reader_name
    if (search.is_back !== '' && search.is_back !== undefined) params.is_back = search.is_back
    const res = await api.get('/borrows', { params })
    tableData.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const handleBorrow = async () => {
  const [rRes, bRes] = await Promise.all([
    api.get('/readers', { params: { pageSize: 999 } }),
    api.get('/books', { params: { pageSize: 999 } })
  ])
  readerOptions.value = rRes.data.list || []
  bookOptions.value = bRes.data.list || []
  borrowForm.reader_id = ''
  borrowForm.book_id = ''
  borrowDialogVisible.value = true
}

const submitBorrow = async () => {
  const valid = await borrowFormRef.value.validate().catch(() => false)
  if (!valid) return
  await api.post('/borrows', borrowForm)
  notifySuccess('借阅成功')
  borrowDialogVisible.value = false
  fetchData()
}

const handleReturn = async (row) => {
  try {
    await ElMessageBox.confirm(`确认归还「${row.book_name}」吗？`, '还书确认', { type: 'info' })
    await api.put(`/borrows/${row.borrow_id}/return`)
    notifySuccess('还书成功')
    fetchData()
  } catch (e) {}
}

onMounted(fetchData)
</script>

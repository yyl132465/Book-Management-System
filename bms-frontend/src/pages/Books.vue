<template>
  <div>
    <el-card shadow="never" class="search-card">
      <el-form :inline="true">
        <el-form-item>
          <el-input v-model="search.book_name" placeholder="图书名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-input v-model="search.author" placeholder="作者" clearable />
        </el-form-item>
        <el-form-item>
          <el-select v-model="search.cate_id" placeholder="分类" clearable style="width:140px">
            <el-option v-for="c in categories" :key="c.cate_id" :label="c.cate_name" :value="c.cate_id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchData">搜索</el-button>
          <el-button type="success" :icon="Plus" @click="handleAdd">新增图书</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading">
        <el-table-column prop="book_id" label="编号" width="100" />
        <el-table-column prop="book_name" label="书名" min-width="140" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="press" label="出版社" width="150" />
        <el-table-column prop="pub_date" label="出版日期" width="120" />
        <el-table-column prop="price" label="价格" width="80" />
        <el-table-column prop="stock" label="库存" width="70" />
        <el-table-column prop="cate_name" label="分类" width="100">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.cate_name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无图书数据" :image-size="100" />
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

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="520px" @close="resetForm">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="编号" prop="book_id">
          <el-input v-model="form.book_id" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="名称" prop="book_name">
          <el-input v-model="form.book_name" />
        </el-form-item>
        <el-form-item label="作者" prop="author">
          <el-input v-model="form.author" />
        </el-form-item>
        <el-form-item label="出版社">
          <el-input v-model="form.press" />
        </el-form-item>
        <el-form-item label="出版日期">
          <el-date-picker v-model="form.pub_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="form.price" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.cate_id" clearable style="width:100%">
            <el-option v-for="c in categories" :key="c.cate_id" :label="c.cate_name" :value="c.cate_id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete } from '@element-plus/icons-vue'
import api, { notifySuccess } from '../api'

const route = useRoute()

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const search = reactive({ book_name: '', author: '', cate_id: '' })
const categories = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增图书')
const isEdit = ref(false)
const formRef = ref(null)
const form = reactive({
  book_id: '', book_name: '', author: '', press: '', pub_date: '', price: null, stock: 0, cate_id: null
})
const rules = {
  book_id: [{ required: true, message: '请输入图书编号', trigger: 'blur' }],
  book_name: [{ required: true, message: '请输入图书名称', trigger: 'blur' }],
  author: [{ required: true, message: '请输入作者', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await api.get('/books', { params: { page: page.value, pageSize: pageSize.value, ...search } })
    tableData.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  const res = await api.get('/categories')
  categories.value = res.data
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增图书'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑图书'
  Object.assign(form, { ...row, pub_date: row.pub_date ? row.pub_date.slice(0, 10) : '' })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除图书「${row.book_name}」吗？`, '删除确认', { type: 'warning' })
    await api.delete(`/books/${row.book_id}`)
    notifySuccess('图书已删除')
    fetchData()
  } catch (e) { /* cancelled */ }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (isEdit.value) {
    await api.put(`/books/${form.book_id}`, form)
    notifySuccess('图书修改成功')
  } else {
    await api.post('/books', form)
    notifySuccess('图书新增成功')
  }
  dialogVisible.value = false
  fetchData()
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(form, { book_id: '', book_name: '', author: '', press: '', pub_date: '', price: null, stock: 0, cate_id: null })
}

onMounted(() => {
  const keyword = route.query?.keyword
  if (keyword) search.book_name = keyword
  fetchData()
  fetchCategories()
})
</script>

<style scoped>
.search-card { margin-bottom: 20px; }
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: nowrap;
}
</style>

<template>
  <div>
    <el-card shadow="never" class="search-card">
      <el-form :inline="true">
        <el-form-item>
          <el-input v-model="search.r_name" placeholder="姓名" clearable style="width:140px" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="search.class" placeholder="班级" clearable style="width:140px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchData">搜索</el-button>
          <el-button type="success" :icon="Plus" @click="handleAdd">新增读者</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading">
        <el-table-column prop="reader_id" label="学号" width="90" />
        <el-table-column prop="r_name" label="姓名" width="70" />
        <el-table-column prop="class" label="班级" min-width="120" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="max_book" label="最大借阅" width="70" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无读者数据" :image-size="120" />
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
        <el-form-item label="学号" prop="reader_id">
          <el-input v-model="form.reader_id" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="姓名" prop="r_name">
          <el-input v-model="form.r_name" />
        </el-form-item>
        <el-form-item label="班级" prop="class">
          <el-input v-model="form.class" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="最大借阅">
          <el-input-number v-model="form.max_book" :min="1" :max="20" style="width:100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="正常" inactive-text="禁用" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete } from '@element-plus/icons-vue'
import api, { notifySuccess } from '../api'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const search = reactive({ r_name: '', class: '' })
const dialogVisible = ref(false)
const dialogTitle = ref('新增读者')
const isEdit = ref(false)
const formRef = ref(null)
const form = reactive({
  reader_id: '', r_name: '', class: '', phone: '', max_book: 5, status: 1
})
const rules = {
  reader_id: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  r_name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  class: [{ required: true, message: '请输入班级', trigger: 'blur' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await api.get('/readers', { params: { page: page.value, pageSize: pageSize.value, ...search } })
    tableData.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增读者'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑读者'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除读者「${row.r_name}(${row.reader_id})」吗？`, '删除确认', { type: 'warning' })
    await api.delete(`/readers/${row.reader_id}`)
    notifySuccess('读者已删除')
    fetchData()
  } catch (e) {}
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (isEdit.value) {
    await api.put(`/readers/${form.reader_id}`, form)
    notifySuccess('读者修改成功')
  } else {
    await api.post('/readers', form)
    notifySuccess('读者新增成功')
  }
  dialogVisible.value = false
  fetchData()
}

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(form, { reader_id: '', r_name: '', class: '', phone: '', max_book: 5, status: 1 })
}

onMounted(fetchData)
</script>

<style scoped>
.search-card {
  padding: 20px 24px 20px;
}
.search-card :deep(.el-form--inline .el-form-item) {
  margin-right: 20px;
}
:deep(.el-card) {
  padding: 24px;
}
:deep(.el-pagination) {
  margin-top: 20px;
}
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: nowrap;
}
</style>

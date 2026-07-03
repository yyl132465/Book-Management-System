<template>
  <div>
    <el-card shadow="never" class="search-card">
      <el-form :inline="true">
        <el-form-item>
          <el-input v-model="searchKey" placeholder="分类名称" clearable style="width:140px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchData">搜索</el-button>
          <el-button type="success" :icon="Plus" @click="handleAdd">新增分类</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading">
        <el-table-column prop="cate_id" label="编号" width="100" />
        <el-table-column prop="cate_name" label="分类名称" min-width="200" />
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无分类数据" :image-size="100" />
        </template>
      </el-table>
    </el-card>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="420px" @close="resetForm">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="分类名称" prop="cate_name">
          <el-input v-model="form.cate_name" placeholder="请输入分类名称" />
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
const searchKey = ref('')
const tableData = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增分类')
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)
const form = reactive({ cate_name: '' })
const rules = { cate_name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }] }

const fetchData = async () => {
  loading.value = true
  try {
    const params = searchKey.value ? { search: searchKey.value } : {}
    const res = await api.get('/categories', { params })
    tableData.value = res.data
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增分类'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editId.value = row.cate_id
  dialogTitle.value = '编辑分类'
  form.cate_name = row.cate_name
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除分类「${row.cate_name}」吗？`, '删除确认', { type: 'warning' })
    await api.delete(`/categories/${row.cate_id}`)
    notifySuccess('分类已删除')
    fetchData()
  } catch (e) {}
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (isEdit.value) {
    await api.put(`/categories/${editId.value}`, form)
    notifySuccess('分类修改成功')
  } else {
    await api.post('/categories', form)
    notifySuccess('分类新增成功')
  }
  dialogVisible.value = false
  fetchData()
}

const resetForm = () => {
  formRef.value?.resetFields()
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
  border-top: 3px solid #5B8DEF;
  padding: 24px;
}
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: nowrap;
}
</style>

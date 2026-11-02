<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getUsers } from '../services/userService'
import { Search, Moon, Sunny } from '@element-plus/icons-vue'
import AddEmployeePage from './AddEmployeePage.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled } from '@element-plus/icons-vue'

// Router
const router = useRouter()
const route = useRoute()

// Dashboard theme
const isDark = ref(false)

// User data
const users = ref([])
const loading = ref(false)
const error = ref('')

// Pagination
const currentPage = ref(Number(route.query.page) || 1)
const limit = ref(Number(route.query.limit) || 5)
const totalUsers = ref(0)

// Search
const searchText = ref(route.query.search || '')

// Main content navigation
// Possible views: users, addEmployee, employeeList
const activeView = ref('users')

//employee data popup
const detailsDialogVisible = ref(false)
const editDialogVisible = ref(false)
const editingEmployee = ref(null)

// Navigate to the registration page
function addUser() {
    router.push('/register')
}

// Load users from the NestJS backend
async function loadUsers() {
    loading.value = true
    error.value = ''

    try {
        const result = await getUsers(
            currentPage.value,
            limit.value,
            searchText.value
        )

        // Supports either an array or a paginated response object.
        if (Array.isArray(result)) {
            users.value = result
            totalUsers.value = result.length
        } else {
            users.value = result.data ?? result.users ?? []
            totalUsers.value = result.total ?? users.value.length
        }

        // Keep the current filters in the URL
        await router.replace({
            query: {
                ...route.query,
                page: currentPage.value,
                limit: limit.value,
                search: searchText.value || undefined
            }
        })
    } catch (err) {
        console.error('Error loading users:', err)
        error.value = err.message || 'Failed to load users'
    } finally {
        loading.value = false
    }
}

// Filter the users currently loaded from the API
const filterTableData = computed(() => {
    const search = searchText.value.trim().toLowerCase()

    if (!search) {
        return users.value
    }

    return users.value.filter(user =>
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search)
    )
})

// Search again when the search text changes
watch(searchText, () => {
    currentPage.value = 1
    loadUsers()
})

// Logout
function logout() {
    sessionStorage.removeItem('token')
    router.push('/login')
}

// Sidebar navigation
function gotoAddEmployee() {
    activeView.value = 'addEmployee'
}


function showUsers() {
    activeView.value = 'users'
}

// Pagination
function handlePageChange(page) {
    currentPage.value = page
    loadUsers()
}

// Load users when the dashboard opens
onMounted(() => {
    loadUsers()
})

//List of employees

const employees = ref([])
const employeesLoading = ref(false)
const employeesError = ref('')
const selectedEmployee = ref(null)

async function loadEmployees() {
    employeesLoading.value = true
    employeesError.value = ''

    try {
        const token = sessionStorage.getItem('token')

        if (!token) {
            throw new Error('Please log in again to view employees')
        }

        const response = await fetch('http://localhost:3000/employees', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        const result = await response.json()

        if (!response.ok) {
            throw new Error(
                result.message || 'Failed to load employees',
            )
        }

        employees.value = result
    } catch (error) {
        console.error('Error loading employees:', error)
        employeesError.value = error.message || 'Failed to load employees'
    } finally {
        employeesLoading.value = false
    }
}

function employeeList() {
    activeView.value = 'employeeList'
    selectedEmployee.value = null
    loadEmployees()
}

function viewEmployee(employee) {
    selectedEmployee.value = employee
}

function formatEmployeeLabel(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (letter) => letter.toUpperCase())
}


async function handleEmployeeSaved() {
    editDialogVisible.value = false
    editingEmployee.value = null
    await loadEmployees()
}




function handleEmployeeAction(command, employee) {
    if (command === 'view') {
        selectedEmployee.value = employee
        detailsDialogVisible.value = true
    }

    if (command === 'edit') {
        editingEmployee.value = { ...employee }
        editDialogVisible.value = true
    }

    if (command === 'delete') {
        deleteEmployee(employee)
    }
}


async function deleteEmployee(employee) {
    try {
        // Ask the user before deleting a database record.
        await ElMessageBox.confirm(
            `Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`,
            'Confirm Delete',
            {
                confirmButtonText: 'Delete',
                cancelButtonText: 'Cancel',
                type: 'warning',
            },
        )

        const token = sessionStorage.getItem('token')

        const response = await fetch(
            `http://localhost:3000/employees/${employee.id}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        )

        const result = await response.json()

        if (!response.ok) {
            throw new Error(
                result.message || 'Failed to delete employee',
            )
        }

        // Remove the deleted employee from the displayed list.
        employees.value = employees.value.filter(
            (item) => item.id !== employee.id,
        )

        // Close the details panel if it showed the deleted employee.
        if (selectedEmployee.value?.id === employee.id) {
            selectedEmployee.value = null
        }

        ElMessage.success('Employee deleted successfully')
    } catch (error) {
        // Cancelling the confirmation is normal; do not show an error for it.
        if (error === 'cancel' || error === 'close') {
            return
        }

        console.error('Delete employee error:', error)
        ElMessage.error(
            error.message || 'Could not delete employee',
        )
    }
}


</script>




<template>
    <div class="dashboard" :class="{ 'dark-theme': isDark }">

        <!-- Header -->
        <div class="header-actions">
            <el-header class="dashboard-header">
                <div class="header-title">
                    <h1>Dashboard</h1>
                    <p>
                        {{
                            activeView === 'users'
                                ? 'Registered Users'
                                : activeView === 'addEmployee'
                                    ? 'Add Employee'
                                    : 'Employee List'
                        }}
                    </p>
                </div>

                <!-- Search only when viewing users -->
                <div v-if="activeView === 'users'" class="search-section">
                    <el-input v-model="searchText" placeholder="Search by name or email..." clearable>
                        <template #prefix>
                            <el-icon>
                                <Search />
                            </el-icon>
                        </template>
                    </el-input>
                </div>

                <!-- Dark mode toggle -->
                <el-button class="theme-toggle" circle @click="isDark = !isDark" aria-label="Toggle dark mode">
                    <el-icon>
                        <Moon v-if="!isDark" />
                        <Sunny v-else />
                    </el-icon>
                </el-button>
            </el-header>
        </div>

        <!-- Main dashboard area -->
        <div class="dashboard-body">

            <!-- Sidebar -->
            <el-aside class="dashboard-sidebar" width="280px">
                <div class="sidebar-card">

                    <!-- User count -->
                    <div class="user-count">
                        <span>Users Shown:</span>
                        <p>{{ users.length }}</p>
                    </div>

                    <el-button class="sidebar-button add-user-button" @click="addUser">
                        Add User
                    </el-button>

                    <el-button class="sidebar-button" @click="gotoAddEmployee">
                        Add Employee
                    </el-button>

                    <el-button class="sidebar-button" @click="employeeList">
                        Employee List
                    </el-button>

                    <!-- Logout stays at the bottom -->
                    <el-button class="sidebar-button logout-button" type="danger" @click="logout">
                        Logout
                    </el-button>
                </div>
            </el-aside>

            <!-- Main content -->
            <main class="dashboard-content">

                <!-- Add Employee form -->
                <template v-if="activeView === 'addEmployee'">
                    <el-button class="back-button" @click="showUsers">
                        Back to Users
                    </el-button>

                    <AddEmployeePage />
                </template>

                <!-- Employee List view -->

                <!-- Employee List view -->
                <template v-else-if="activeView === 'employeeList'">
                    <el-button class="back-button" @click="showUsers">
                        Back to Users
                    </el-button>

                    <!-- Employee table card -->
                    <el-card class="employee-card">
                        <template #header>
                            <div class="employee-card-header">
                                <h2>Employee List</h2>

                                <el-button type="primary" :loading="employeesLoading" @click="loadEmployees">
                                    Refresh List
                                </el-button>
                            </div>
                        </template>

                        <el-alert v-if="employeesError" :title="employeesError" type="error" show-icon
                            :closable="false" />

                        <el-table v-loading="employeesLoading" :data="employees" border stripe style="width: 100%"
                            empty-text="No employees found">
                            <el-table-column prop="id" label="ID" width="75" />

                            <el-table-column label="Name" min-width="170">
                                <template #default="{ row }">
                                    {{ [row.firstName, row.middleName, row.lastName]
                                        .filter(Boolean).join(' ') }}
                                </template>
                            </el-table-column>

                            <el-table-column prop="email" label="Email" min-width="220" show-overflow-tooltip />

                            <el-table-column prop="employeeCode" label="Employee Code" min-width="145" />

                            <el-table-column prop="department" label="Department" min-width="140" />

                            <el-table-column prop="designation" label="Designation" min-width="170" />

                            <el-table-column prop="employmentStatus" label="Status" width="120" />


                            <el-table-column label="Actions" width="130" fixed="right">
                                <template #default="scope">
                                    <el-dropdown trigger="click"
                                        @command="(command) => handleEmployeeAction(command, scope.row)">
                                        <el-button type="primary" plain>
                                            Actions
                                            <el-icon class="el-icon--right">
                                                <MoreFilled />
                                            </el-icon>
                                        </el-button>

                                        <template #dropdown>
                                            <el-dropdown-menu>
                                                <el-dropdown-item command="view">
                                                    View Details
                                                </el-dropdown-item>

                                                <el-dropdown-item command="edit">
                                                    Edit Employee
                                                </el-dropdown-item>

                                                <el-dropdown-item command="delete" divided>
                                                    Delete Employee
                                                </el-dropdown-item>
                                            </el-dropdown-menu>
                                        </template>
                                    </el-dropdown>
                                </template>
                            </el-table-column>




                        </el-table>
                    </el-card>


                </template>

                <!-- Existing users dashboard -->
                <template v-else>
                    <p v-if="loading" class="loading-message">
                        Loading users...
                    </p>

                    <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />

                    <el-table v-if="!loading && filterTableData.length > 0" :data="filterTableData" border stripe
                        class="users-table" style="width: 100%">
                        <el-table-column label="ID" prop="id" width="80" />

                        <el-table-column label="Name" prop="name" min-width="150" />

                        <el-table-column label="Email" prop="email" min-width="220" />

                        <el-table-column label="Age" prop="age" width="100" />
                    </el-table>

                    <el-empty v-if="!loading && !error && filterTableData.length === 0" description="No users found" />

                    <!-- Pagination -->
                    <div class="pagination">
                        <el-pagination background layout="prev, pager, next" :current-page="currentPage"
                            :page-size="limit" :total="totalUsers" @current-change="handlePageChange" />
                    </div>
                </template>
            </main>
        </div>

        <!-- View employee details popup. -->
        <el-dialog
            v-model="detailsDialogVisible"
            title="Employee Details"
            width="min(900px, 95%)"
            top="4vh"
            class="employee-details-dialog"
            destroy-on-close
        >
            <div v-if="selectedEmployee" class="employee-details-scroll">
                <el-descriptions :column="2" border>
                    <el-descriptions-item
                        v-for="(value, key) in selectedEmployee"
                        :key="key"
                        :label="formatEmployeeLabel(key)"
                    >
                        {{ value ?? '—' }}
                    </el-descriptions-item>
                </el-descriptions>
            </div>
            <template #footer>
                <el-button @click="detailsDialogVisible = false">Close</el-button>
            </template>
        </el-dialog>

        <!-- Edit employee popup. Reuses the same form in edit mode. -->
        <el-dialog
            v-model="editDialogVisible"
            title="Edit Employee"
            width="min(1000px, 95%)"
            top="3vh"
            class="employee-edit-dialog"
            destroy-on-close
        >
            <div class="edit-employee-scroll">
                <AddEmployeePage
                    v-if="editingEmployee"
                    :key="editingEmployee.id"
                    :employee="editingEmployee"
                    mode="edit"
                    @saved="handleEmployeeSaved"
                    @cancel="editDialogVisible = false"
                />
            </div>
        </el-dialog>

        <!-- Footer -->
        <footer class="dashboard-footer">
            User Management Dashboard
        </footer>
    </div>
</template>



<style scoped>
/* ========================================
   FULL DASHBOARD LAYOUT
======================================== */
.dashboard {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f5f7fa;
    color: #303133;
    transition: background-color 0.3s ease, color 0.3s ease;
    box-sizing: border-box;
}

/* ========================================
   HEADER
======================================== */
.header-actions {
    width: 100%;
}

.dashboard-header {
    height: auto;
    min-height: 100px;
    padding: 24px 32px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 24px;
    background: #ffffff;
    border-bottom: 1px solid #e4e7ed;
    transition: background-color 0.3s ease, color 0.3s ease;
}

.header-title {
    flex-shrink: 0;
}

.header-title h1 {
    margin: 0 0 8px;
    font-size: 28px;
    font-weight: 600;
}

.header-title p {
    margin: 0;
    color: #606266;
    font-size: 14px;
}

/* Search input */
.search-section {
    display: flex;
    width: 320px;
    max-width: 100%;
    margin-left: auto;
}

.search-section :deep(.el-input__wrapper) {
    border-radius: 8px;
}

/* Dark mode toggle */
.theme-toggle {
    flex-shrink: 0;
    margin: 0;
    border-radius: 50%;
}

/* ========================================
   MAIN DASHBOARD BODY
======================================== */
.dashboard-body {
    flex: 1;
    display: flex;
    align-items: stretch;
    gap: 24px;
    padding: 28px 32px 20px;
    box-sizing: border-box;
}

/* ========================================
   SIDEBAR
======================================== */
.dashboard-sidebar {
    flex: 0 0 280px;
    width: 280px;
    min-width: 280px;
    align-self: stretch;
    display: flex;
    box-sizing: border-box;
}

.sidebar-card {
    width: 100%;
    min-height: 100%;
    padding: 20px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    background: #ffffff;
    border: 1px solid #e4e7ed;
    border-radius: 10px;
    transition: background-color 0.3s ease, color 0.3s ease;
}

/* User count */
.user-count {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    font-size: 14px;
}

.user-count span {
    color: #606266;
}

.user-count p {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
}

/* Sidebar buttons */
.sidebar-button {
    width: 100%;
    height: 42px;
    margin: 0 0 12px !important;
    border-radius: 6px;
    justify-content: flex-start;
    padding-left: 16px;
}

/* Add User button: white background */
.add-user-button {
    color: #303133 !important;
    background: #ffffff !important;
    border: 1px solid #dcdfe6 !important;
}

.add-user-button:hover {
    color: #409eff !important;
    background: #ecf5ff !important;
    border-color: #409eff !important;
}

/* Keep Logout at the bottom */
.logout-button {
    margin-top: auto !important;
    margin-bottom: 0 !important;
}

/* ========================================
   MAIN CONTENT
======================================== */
.dashboard-content {
    flex: 1;
    min-width: 0;
    padding: 24px;
    box-sizing: border-box;
    background: #ffffff;
    border: 1px solid #e4e7ed;
    border-radius: 10px;
    transition: background-color 0.3s ease, color 0.3s ease;
}

/* Back button above employee form/list */
.back-button {
    margin-bottom: 20px;
}

/* Loading message */
.loading-message {
    padding: 12px 0;
    color: #606266;
    font-size: 14px;
}

/* ========================================
   USERS TABLE
======================================== */
.users-table {
    width: 100%;
    border-radius: 6px;
    overflow: hidden;
}

.users-table :deep(.el-table__header th) {
    background: #f5f7fa;
    color: #303133;
    font-weight: 600;
}

.users-table :deep(.el-table__row:hover > td) {
    background: #ecf5ff;
}

/* ========================================
   PAGINATION
======================================== */
.pagination {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 24px;
}

/* ========================================
   FOOTER
======================================== */
.dashboard-footer {
    margin-top: auto;
    padding: 18px 32px;
    text-align: center;
    font-size: 13px;
    color: #909399;
    background: #ffffff;
    border-top: 1px solid #e4e7ed;
    transition: background-color 0.3s ease, color 0.3s ease;
}

.employee-card {
    margin-bottom: 24px;
    min-width: 0;
}

.employee-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}

.employee-card-header h2 {
    margin: 0;
}

/* Employee popup scrolling */
.employee-details-scroll,
.edit-employee-scroll {
    max-height: 68vh;
    overflow: auto;
    padding: 4px;
}

.employee-card :deep(.el-table) {
    width: 100%;
}

.employee-card :deep(.el-table__body-wrapper),
.employee-card :deep(.el-table__header-wrapper) {
    overflow-x: hidden;
}

/* ========================================
   DARK MODE
======================================== */
.dashboard.dark-theme {
    background: #181a1b;
    color: #e4e7ed;
}

/* Header */
.dashboard.dark-theme .dashboard-header {
    background: #242526;
    color: #e4e7ed;
    border-bottom-color: #414243;
}

.dashboard.dark-theme .header-title p {
    color: #c0c4cc;
}

/* Sidebar */
.dashboard.dark-theme .sidebar-card {
    background: #242526;
    color: #e4e7ed;
    border-color: #414243;
}

.dashboard.dark-theme .user-count span {
    color: #c0c4cc;
}

/* Main content */
.dashboard.dark-theme .dashboard-content {
    background: #242526;
    color: #e4e7ed;
    border-color: #414243;
}

/* Add User button in dark mode */
.dashboard.dark-theme .add-user-button {
    background: #303234 !important;
    color: #e4e7ed !important;
    border-color: #505256 !important;
}

.dashboard.dark-theme .add-user-button:hover {
    background: #3a4655 !important;
    color: #79bbff !important;
    border-color: #409eff !important;
}

/* Theme toggle in dark mode */
.dashboard.dark-theme .theme-toggle {
    background: #303234;
    color: #e4e7ed;
    border-color: #505256;
}

/* Footer */
.dashboard.dark-theme .dashboard-footer {
    background: #242526;
    color: #c0c4cc;
    border-top-color: #414243;
}

/* Search input */
.dashboard.dark-theme .search-section :deep(.el-input__wrapper) {
    background: #303234;
    box-shadow: 0 0 0 1px #505256 inset;
}

.dashboard.dark-theme .search-section :deep(.el-input__inner) {
    color: #e4e7ed;
}

.dashboard.dark-theme .search-section :deep(.el-input__inner::placeholder) {
    color: #a8abb2;
}

/* Table in dark mode */
.dashboard.dark-theme .users-table :deep(.el-table),
.dashboard.dark-theme .users-table :deep(tr),
.dashboard.dark-theme .users-table :deep(th.el-table__cell),
.dashboard.dark-theme .users-table :deep(td.el-table__cell) {
    background-color: #242526;
    color: #e4e7ed;
    border-color: #414243;
}

.dashboard.dark-theme .users-table :deep(.el-table__header th) {
    background-color: #303234;
    color: #e4e7ed;
}

.dashboard.dark-theme .users-table :deep(.el-table__body tr:hover > td) {
    background-color: #343638;
}

.dashboard.dark-theme .users-table :deep(.el-table__inner-wrapper::before),
.dashboard.dark-theme .users-table :deep(.el-table--border::after),
.dashboard.dark-theme .users-table :deep(.el-table--border::before) {
    background-color: #414243;
}

/* Loading text */
.dashboard.dark-theme .loading-message {
    color: #c0c4cc;
}

/* ========================================
   RESPONSIVE DESIGN
======================================== */
@media (max-width: 900px) {
    .dashboard-header {
        padding: 20px;
        gap: 16px;
    }

    .dashboard-body {
        gap: 16px;
        padding: 20px;
    }

    .dashboard-sidebar {
        flex-basis: 220px;
        width: 220px;
        min-width: 220px;
    }

    .dashboard-content {
        padding: 16px;
    }

    .search-section {
        width: 260px;
    }
}

@media (max-width: 700px) {
    .dashboard-header {
        flex-wrap: wrap;
        align-items: center;
        padding: 20px;
    }

    .header-title {
        flex: 1;
    }

    .search-section {
        order: 3;
        width: 100%;
        margin-left: 0;
    }

    .dashboard-body {
        flex-direction: column;
        padding: 16px;
    }

    .dashboard-sidebar {
        flex: none;
        width: 100%;
        min-width: 0;
    }

    .sidebar-card {
        min-height: 0;
    }

    .logout-button {
        margin-top: 12px !important;
    }

    .dashboard-content {
        width: 100%;
        padding: 16px;
        overflow-x: hidden;
    }

    .pagination {
        justify-content: center;
    }

    .dashboard-footer {
        padding: 16px;
    }
}
</style>
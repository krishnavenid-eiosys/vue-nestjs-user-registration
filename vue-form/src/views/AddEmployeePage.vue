<script setup>
import { reactive, ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, Location } from '@element-plus/icons-vue'

const props = defineProps({
  employee: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: 'add',
  },
})

const emit = defineEmits(['saved', 'cancel'])



// These values hold what the user types into the form.
const employee = reactive({
  // Basic Details
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  profilePhotoUrl: '',

  // Contact Details
  email: '',
  mobileNumber: '',
  alternateMobileNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: '',
  pinCode: '',


  // 3. Employment Details
  employeeCode: '',
  department: '',
  designation: '',
  employmentType: '',
  dateOfJoining: '',
  reportingManager: '',
  workLocation: '',
  employmentStatus: 'Active',

  // 4. Salary Details
  basicSalary: 0,
  hra: 0,
  allowances: 0,
  deductions: 0,

  // Bank Details
  bankAccountNumber: '',
  bankName: '',
  ifscCode: '',

  // 5. Additional Details
  highestQualification: '',
  previousExperience: 0,
  skills: '',

  // Emergency Contact
  emergencyContactName: '',
  emergencyContactNumber: '',
  emergencyContactRelationship: '',
})

watch(
  () => props.employee,
  (employeeData) => {
    if (props.mode === 'edit' && employeeData) {
      // Copy the selected employee's existing values into the form.
      Object.assign(employee, employeeData)
    }
  },
  { immediate: true },
)

// Suggested designations for the autocomplete field.
const designations = [
  { value: 'Software Developer' },
  { value: 'Senior Software Developer' },
  { value: 'Team Lead' },
  { value: 'Project Manager' },
  { value: 'HR Executive' },
  { value: 'Accountant' },
]

const options = ref({
  gender: [],
  department: [],
  designation: [],
  state: [],
  country: [],
  employmentType: [],
  employmentStatus: [],
})


async function loadOptions() {
  const token = sessionStorage.getItem('token')

  try {
    const response = await fetch(
      'http://localhost:3000/employees/options',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error('Could not load dropdown options')
    }

    options.value = await response.json()
  } catch (error) {
    console.error('Loading options failed:', error)
    ElMessage.error('Failed to load form dropdown options')
  }
}

onMounted(() => {
  loadOptions()
})

// Element Plus calls this function as the user types.
function searchDesignations(queryString, callback) {
  const results = options.value.designation
    .filter(item =>
      item.toLowerCase().includes(queryString.toLowerCase())
    )
    .map(item => ({ value: item }))

  callback(results)
}

// Prevent selecting a future joining date.
function disableFutureDates(date) {
  return date.getTime() > Date.now()
}

// Temporarily check whether the form captures our values.

const submitting = ref(false)

async function submitEmployee() {
  // Prevent accidental double-clicks.
  if (submitting.value) return

  // Validate required fields.
  if (
    !employee.firstName.trim() ||
    !employee.lastName.trim() ||
    !employee.email.trim() ||
    !employee.employeeCode.trim() ||
    !employee.pinCode.trim()
  ) {
    ElMessage.warning(
      'Please enter first name, last name, email, employee code and pincode.'
    )
    return
  }

  const token = sessionStorage.getItem('token')

  if (!token) {
    ElMessage.error('Your login session has expired. Please log in again.')
    return
  }

  // Determine whether we are adding or editing.
  const isEditing = props.mode === 'edit' && props.employee?.id

  // Prepare the data for the backend.
  const payload = {
    ...employee,
    firstName: employee.firstName.trim(),
    lastName: employee.lastName.trim(),
    email: employee.email.trim().toLowerCase(),
    employeeCode: employee.employeeCode.trim(),
    pinCode: employee.pinCode.trim(),
    dateOfBirth: employee.dateOfBirth || null,
    dateOfJoining: employee.dateOfJoining || null,
  }

  submitting.value = true

  try {
    const response = await fetch(
      isEditing
        ? `http://localhost:3000/employees/${props.employee.id}`
        : 'http://localhost:3000/employees',
      {
        // Edit uses PATCH; adding uses POST.
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        Array.isArray(result.message)
          ? result.message.join(', ')
          : result.message || 'Failed to save employee'
      )
    }

    ElMessage.success(
      isEditing
        ? 'Employee updated successfully!'
        : 'Employee added successfully!'
    )

    console.log('Saved employee:', result)

    // Notify DashboardPage.vue so it can close the popup
    // and refresh the employee list.
    emit('saved', result)

  } catch (error) {
    console.error('Employee submission failed:', error)
    ElMessage.error(error.message || 'Unable to save employee')
  } finally {
    submitting.value = false
  }
}



</script>

<template>
  <div class="add-employee-page" :class="{ 'dialog-form': mode === 'edit' }">
    <h1>{{ mode === 'edit' ? 'Edit Employee' : 'Add Employee' }}</h1>
    <p class="subtitle">{{ mode === 'edit' ? 'Update the employee details below.' : "Enter the employee's basic details." }}</p>

    <el-card class="form-card">
      <h2>1. Basic Details</h2>

      <el-form :model="employee" label-position="top">
        <el-row :gutter="20">
          <!-- First Name -->
          <el-col :span="8">
            <el-form-item label="First Name" required>
              <el-input v-model="employee.firstName" placeholder="Enter first name" />
            </el-form-item>
          </el-col>

          <!-- Middle Name -->
          <el-col :span="8">
            <el-form-item label="Middle Name">
              <el-input v-model="employee.middleName" placeholder="Enter middle name" />
            </el-form-item>
          </el-col>

          <!-- Last Name -->
          <el-col :span="8">
            <el-form-item label="Last Name" required>
              <el-input v-model="employee.lastName" placeholder="Enter last name" />
            </el-form-item>
          </el-col>

          <!-- Date of Birth -->
          <el-col :span="12">
            <el-form-item label="Date of Birth" required>
              <el-date-picker v-model="employee.dateOfBirth" type="date" placeholder="Select date of birth"
                format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>

          <!-- Gender -->
          <el-col :span="12">
            <el-form-item label="Gender" required>
              <el-select v-model="employee.gender" placeholder="Select gender" style="width: 100%">
                <el-option v-for="item in options.gender" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- Profile Photo URL -->
          <el-col :span="24">
            <el-form-item label="Profile Photo URL">
              <el-input v-model="employee.profilePhotoUrl" placeholder="Paste the employee photo URL" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>


      <!-- 2. CONTACT DETAILS -->
      <h2>2. Contact Details</h2>

      <el-form :model="employee" label-position="top">
        <el-row :gutter="20">

          <!-- Email -->
          <el-col :xs="24" :sm="12">
            <el-form-item label="Email" required>
              <el-input v-model="employee.email" type="email" placeholder="Enter email address" />
            </el-form-item>
          </el-col>

          <!-- Mobile Number -->
          <el-col :xs="24" :sm="12">
            <el-form-item label="Mobile Number" required>
              <el-input v-model="employee.mobileNumber" placeholder="Enter mobile number" maxlength="15" />
            </el-form-item>
          </el-col>

          <!-- Alternate Mobile Number -->
          <el-col :xs="24" :sm="12">
            <el-form-item label="Alternate Mobile Number">
              <el-input v-model="employee.alternateMobileNumber" placeholder="Enter alternate number" maxlength="15" />
            </el-form-item>
          </el-col>

          <!-- Pincode -->
          <el-col :xs="24" :sm="12">
            <el-form-item label="Pincode" required>
              <el-input v-model="employee.pinCode" placeholder="Enter pincode" maxlength="20" />
            </el-form-item>
          </el-col>

          <!-- Address Line 1 -->
          <el-col :span="24">
            <el-form-item label="Address Line 1" required>
              <el-input v-model="employee.addressLine1" placeholder="Enter house number, street, etc." />
            </el-form-item>
          </el-col>

          <!-- Address Line 2 -->
          <el-col :span="24">
            <el-form-item label="Address Line 2">
              <el-input v-model="employee.addressLine2" placeholder="Apartment, landmark, etc. (optional)" />
            </el-form-item>
          </el-col>

          <!-- City -->
          <el-col :xs="24" :sm="12">
            <el-form-item label="City" required>
              <el-input v-model="employee.city" placeholder="Enter city" />
            </el-form-item>
          </el-col>

          <!-- State -->
          <el-col :xs="24" :sm="12">
            <el-form-item label="State" required>
              <el-select v-model="employee.state" placeholder="Select state" filterable style="width: 100%">
                <el-option v-for="item in options.state" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- Country -->
          <el-col :xs="24" :sm="12">
            <el-form-item label="Country" required>
              <el-select v-model="employee.country" placeholder="Select country" filterable style="width: 100%">
                <el-option v-for="item in options.country" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>

        </el-row>
      </el-form>

      <!-- 3. EMPLOYMENT DETAILS -->
      <h2>3. Employment Details</h2>

      <el-form :model="employee" label-position="top">
        <el-row :gutter="20">

          <!-- Employee Code with tooltip -->
          <el-col :xs="24" :sm="12">
            <el-form-item label="Employee Code" required>

              <template #label>
                Employee Code
                <el-tooltip content="Enter a unique employee code, for example EMP-001" placement="top">
                  <el-icon class="help-icon">
                    <InfoFilled />
                  </el-icon>
                </el-tooltip>
              </template>

              <el-input v-model="employee.employeeCode" placeholder="e.g. EMP-001" clearable maxlength="100" />
            </el-form-item>
          </el-col>

          <!-- Department dropdown -->
          <el-col :xs="24" :sm="12">
            <el-form-item label="Department" required>
              <el-select v-model="employee.department" placeholder="Select department" filterable clearable
                style="width: 100%">
                <el-option v-for="item in options.department" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- Designation with suggestions -->
          <el-col :xs="24" :sm="12">
            <el-form-item label="Designation" required>
              <el-autocomplete v-model="employee.designation" :fetch-suggestions="searchDesignations"
                placeholder="Type or select a designation" clearable style="width: 100%" />
            </el-form-item>
          </el-col>

          <!-- Employment Type -->
          <el-col :xs="24" :sm="12">
            <el-form-item label="Employment Type" required>
              <el-select v-model="employee.employmentType" placeholder="Select employment type" style="width: 100%">
                <el-option v-for="item in options.employmentType" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- Date of Joining -->
          <el-col :xs="24" :sm="12">
            <el-form-item label="Date of Joining" required>
              <el-date-picker v-model="employee.dateOfJoining" type="date" placeholder="Select joining date"
                format="DD/MM/YYYY" value-format="YYYY-MM-DD" :disabled-date="disableFutureDates" style="width: 100%" />
            </el-form-item>
          </el-col>

          <!-- Reporting Manager -->
          <el-col :xs="24" :sm="12">
            <el-form-item label="Reporting Manager">
              <el-input v-model="employee.reportingManager" placeholder="Enter manager's name (optional)" clearable />
            </el-form-item>
          </el-col>

          <!-- Work Location -->
          <el-col :xs="24" :sm="12">
            <el-form-item label="Work Location" required>
              <el-input v-model="employee.workLocation" placeholder="Enter office location" clearable>
                <template #prefix>
                  <el-icon>
                    <Location />
                  </el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>

          <!-- Employment Status -->
          <el-col :span="24">
            <el-form-item label="Employment Status" required>
              <el-radio-group v-model="employee.employmentStatus">
                <el-radio v-for="item in options.employmentStatus" :key="item" :value="item">
                  {{ item }}
                </el-radio>
              </el-radio-group>

              <el-tag :type="employee.employmentStatus === 'Active'
                ? 'success'
                : employee.employmentStatus === 'Inactive'
                  ? 'danger'
                  : 'warning'" effect="light">
                {{ employee.employmentStatus }}
              </el-tag>
            </el-form-item>
          </el-col>

          <!-- Salary Details -->


          <!-- Additional Details-->


        </el-row>
      </el-form>
    </el-card>



    <!-- Temporary button for testing -->
    <div class="form-actions">
      <el-button @click="emit('cancel')">Cancel</el-button>
      <el-button type="primary" @click="submitEmployee" :loading="submitting">
        {{ submitting ? 'Saving...' : (mode === 'edit' ? 'Save Changes' : 'Submit Employee') }}
      </el-button>
    </div>
  </div>
</template>


<style scoped>
.add-employee-page {
  padding: 24px;
}

.add-employee-page.dialog-form {
  padding: 0;
}

.subtitle {
  color: #777;
  margin-bottom: 24px;
}

.form-card {
  margin-bottom: 24px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

h1 {
  margin-bottom: 8px;
}

h2 {
  margin-top: 0;
  margin-bottom: 24px;
}
</style>
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Dashboard API
export const getDashboardStats = () => api.get('/dashboard/stats');

// Residents API
export const getResidents = (params) => api.get('/residents', { params });
export const getResidentById = (id) => api.get(`/residents/${id}`);
export const getResidentByFlat = (flatNumber) => api.get(`/residents/flat/${flatNumber}`);
export const createResident = (data) => api.post('/residents', data);
export const updateResident = (id, data) => api.put(`/residents/${id}`, data);
export const deleteResident = (id) => api.delete(`/residents/${id}`);

// Maintenance API
export const getMaintenanceRecords = (params) => api.get('/maintenance', { params });
export const getMaintenanceById = (id) => api.get(`/maintenance/${id}`);
export const createMaintenanceRecord = (data) => api.post('/maintenance', data);
export const payMaintenance = (id, paymentMethod = 'UPI') => api.post(`/maintenance/${id}/pay?paymentMethod=${paymentMethod}`);
export const updateMaintenanceStatus = (id, status) => api.put(`/maintenance/${id}/status?status=${status}`);
export const getMonthlyReport = (month) => api.get('/maintenance/monthly-report', { params: { month } });
export const getChronologicalReports = () => api.get('/maintenance/chronological-reports');
export const getRangeReports = (startMonth, endMonth) => api.get('/maintenance/range-reports', { params: { startMonth, endMonth } });

// Complaints API
export const getComplaints = () => api.get('/complaints');
export const getComplaintById = (id) => api.get(`/complaints/${id}`);
export const submitComplaint = (data) => api.post('/complaints', data);
export const registerComplaintDto = (data) => api.post('/complaints/register', data);
export const assignComplaintStaff = (id, staffName) => api.put(`/complaints/${id}/assign?staffName=${encodeURIComponent(staffName)}`);
export const assignComplaintDto = (id, data) => api.put(`/complaints/${id}/assign-dto`, data);
export const resolveComplaint = (id, data) => api.put(`/complaints/${id}/resolve`, data);
export const closeComplaint = (id, data) => api.put(`/complaints/${id}/close`, data);
export const reopenComplaint = (id, data) => api.put(`/complaints/${id}/reopen`, data);
export const updateComplaintStatus = (id, status, remarks = '', performedBy = 'Admin') => 
  api.put(`/complaints/${id}/status?status=${status}&remarks=${encodeURIComponent(remarks)}&performedBy=${encodeURIComponent(performedBy)}`);
export const updateComplaintPriority = (id, priority) => api.put(`/complaints/${id}/priority?priority=${priority}`);
export const assignNextFifo = (staff = 'Ramesh Verma (Senior Electrician)') => api.post(`/complaints/assign-next-fifo?staff=${encodeURIComponent(staff)}`);
export const assignNextPriority = (staff = 'Mukesh Solanki (Emergency Technician)') => api.post(`/complaints/assign-next-priority?staff=${encodeURIComponent(staff)}`);
export const getComplaintTimeline = (id) => api.get(`/complaints/${id}/timeline`);

// Visitors API
export const getVisitors = (params) => api.get('/visitors', { params });
export const getActiveVisitors = () => api.get('/visitors/active');
export const registerVisitor = (data) => api.post('/visitors', data);
export const checkoutVisitor = (id) => api.put(`/visitors/${id}/exit`);

// Expenses API
export const getExpenses = (category) => api.get('/expenses', { params: { category } });
export const createExpense = (data) => api.post('/expenses', data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);
export const getExpenseOverview = () => api.get('/expenses/overview');

// Notices API
export const getNotices = () => api.get('/notices');
export const getPinnedNotices = () => api.get('/notices/pinned');
export const createNotice = (data) => api.post('/notices', data);
export const updateNotice = (id, data) => api.put(`/notices/${id}`, data);
export const deleteNotice = (id) => api.delete(`/notices/${id}`);

// Building Graph API
export const getBuildingGraph = () => api.get('/building/graph');
export const getBuildingBfs = (startNode = 'BLDG-A') => api.get('/building/bfs', { params: { startNode } });
export const getBuildingDfs = (startNode = 'BLDG-A') => api.get('/building/dfs', { params: { startNode } });
export const findBuildingPath = (from, to) => api.get('/building/path', { params: { from, to } });
export const getConnectedNodes = (nodeId) => api.get(`/building/connected/${nodeId}`);

// Data Structures Monitor API
export const getAllDataStructuresStats = () => api.get('/datastructures/all');
export const getArrayListStats = () => api.get('/datastructures/arraylist');
export const getLinkedListStats = () => api.get('/datastructures/linkedlist');
export const getStackStats = () => api.get('/datastructures/stack');
export const undoLastAction = () => api.post('/datastructures/stack/undo');
export const getQueueStats = () => api.get('/datastructures/queue');
export const getPriorityQueueStats = () => api.get('/datastructures/priority-queue');
export const getBstStats = () => api.get('/datastructures/bst');
export const getGraphStats = () => api.get('/datastructures/graph');
export const getAvlStats = () => api.get('/datastructures/avl');
export const searchAvl = (flat) => api.get('/datastructures/avl/search', { params: { flat } });
export const insertAvlDemo = (resident) => api.post('/datastructures/avl/insert', resident);
export const deleteAvlDemo = (flat) => api.delete('/datastructures/avl/delete', { params: { flat } });

// Admin & Society API
export const resetDemoData = () => api.post('/admin/reset-demo-data');
export const getSocietyInfo = () => api.get('/admin/society-info');

// Billing Month Management API
export const getAvailableMonths = () => api.get('/maintenance/months');
export const changeBillingMonth = (month) => api.post('/maintenance/change-billing-month', null, { params: month ? { month } : {} });
export const markAllFlatsPaid = (month) => api.post('/maintenance/mark-all-paid', null, { params: month ? { month } : {} });

export default api;

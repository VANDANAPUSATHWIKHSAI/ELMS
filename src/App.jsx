import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

// Components
import Login from "./components/login"; 
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Home from "./components/home";
import Profile from "./components/profile";
import ApplyLeave from "./components/leave/ApplyLeave"; 
import LeaveHistory from "./components/leave/LeaveHistory";
import LeaveLedgerView from "./components/leave/LeaveLedgerView";
import EmployeeSearch from "./components/search/EmployeeSearch";
import Adjustments from "./components/adjustments/Adjustments";

// HoD Pages
import HodDashboard from './components/dashboards/HodDashboard'; 
import HodApprovals from './components/dashboards/HodApprovals'; 
import Reports from './components/dashboards/Reports';

// Principal Pages
import PrincipalDashboard from './components/dashboards/PrincipalDashboard';
import PrincipalApprovals from './components/dashboards/PrincipalApprovals';
import PrincipalReports from './components/dashboards/PrincipalReports';
import PrincipalEmployees from './components/dashboards/PrincipalEmployees';
import PrincipalAnalytics from './components/dashboards/PrincipalAnalytics';
import PrincipalRejectedReview from './components/dashboards/PrincipalRejectedReview';


// Admin Pages
import AdminDashboard from './components/admin/AdminDashboard';
import AdminEmployees from './components/admin/AdminEmployees';
import AdminAllocateLeave from './components/admin/AdminAllocateLeave';
import AdminDepartments from './components/admin/AdminDepartments';
import AdminReports from './components/admin/AdminReports';
import AdminHolidays from './components/admin/AdminHolidays';
import AdminLateMarksManager from './components/admin/AdminLateMarksManager';
import AdminLeaveTypes from './components/admin/AdminLeaveTypes';
import AccountSettings from './components/AccountSettings';

// Messages
import ContactForm from './components/ContactForm';
import MessagesView from './pages/Admin/MessagesView';
import ForgotPassword from './components/ForgotPassword';
import VerifyOTP from './components/VerifyOTP';
import ResetPassword from './components/ResetPassword';
import EmployeeInbox from './components/EmployeeInbox';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
      <Router>
        <Routes>
          {/* Public Route (NO SIDEBAR) */}
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* PROTECTED ROUTES (WRAPPED IN LAYOUT FOR SIDEBAR & TOPBAR) */}
          <Route element={<Layout />}>
            
            {/* Standard Employee Routes */}
            <Route path="/home" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/leaves" element={<ApplyLeave />} />
            <Route path="/leave-history" element={<LeaveHistory />} />
            <Route path="/view-leaves" element={<LeaveHistory />} />
            <Route path="/view-leaves-ledger" element={<LeaveLedgerView />} />
            <Route path="/search" element={<EmployeeSearch />} />
            <Route path="/adjustments" element={<Adjustments />} />
            <Route path="/settings" element={<AccountSettings />} />
            <Route path="/contact" element={<ContactForm />} />
            <Route 
              path="/inbox" 
              element={
                <ProtectedRoute>
                  <EmployeeInbox />
                </ProtectedRoute>
              } 
            />
            
            {/* HoD Specific Routes */}
            <Route 
              path="/hod-dashboard" 
              element={
                <ProtectedRoute role="HoD">
                  <HodDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/approvals" 
              element={
                <ProtectedRoute role="HoD">
                  <HodApprovals />
                </ProtectedRoute>
              } 
            />

            {/* REPORTS ROUTE MOVED INSIDE THE LAYOUT */}
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute role="HoD">
                  <Reports />
                </ProtectedRoute>
              } 
            />


            <Route 
              path="/hod/messages" 
              element={
                <ProtectedRoute role="HoD">
                  <MessagesView />
                </ProtectedRoute>
              } 
            />
            
            {/* Principal Specific Routes */}
            <Route 
              path="/principal-dashboard" 
              element={
                <ProtectedRoute role="Principal">
                  <PrincipalDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/principal/rejected-review" 
              element={
                <ProtectedRoute role="Principal">
                  <PrincipalRejectedReview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/principal/reports" 
              element={
                <ProtectedRoute role="Principal">
                  <PrincipalReports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/principal/employees" 
              element={
                <ProtectedRoute role="Principal">
                  <PrincipalEmployees />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/principal/analytics" 
              element={
                <ProtectedRoute role="Principal">
                  <PrincipalAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/principal/messages" 
              element={
                <ProtectedRoute role="Principal">
                  <MessagesView />
                </ProtectedRoute>
              } 
            />

            {/* Admin Specific Routes */}
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute role="Admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/employees" 
              element={
                <ProtectedRoute role="Admin">
                  <AdminEmployees />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/departments" 
              element={
                <ProtectedRoute role="Admin">
                  <AdminDepartments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/leave-types" 
              element={
                <ProtectedRoute role="Admin">
                  <AdminLeaveTypes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/allocate-leave" 
              element={
                <ProtectedRoute role="Admin">
                  <AdminAllocateLeave />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/reports" 
              element={
                <ProtectedRoute role="Admin">
                  <AdminReports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/holidays" 
              element={
                <ProtectedRoute role="Admin">
                  <AdminHolidays />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/late-marks" 
              element={
                <ProtectedRoute role="Admin">
                  <AdminLateMarksManager />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/messages" 
              element={
                <ProtectedRoute role="Admin">
                  <MessagesView />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Fallback Catch-All Route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import { useAuthStore, useThemeStore } from "./store/authStore";
import { getTheme } from "./store/theme";

import HomeScreen from "./pages/home";
import Login from "./pages/login";

import ProtectedRoute from "./ProtectedRoute";
import Navbar from "./global/navbar";
import Sidebar from "./global/sidebar";
import CustomersScreen from "./pages/customers";
import InvoiceList from "./pages/Invoices";
import AddCustomer from "./pages/addCustomers";
import CreateInvoice from "./pages/createInvoice";
import InvoiceDetails from "./pages/InvoiceDetail";
import CustomerDetails from "./pages/customerDetails";
import Payments from "./pages/payments";
import PaymentDetails from "./pages/PaymentDetail";
import CreatePayment from "./pages/addPayment";
import Receipts from "./pages/receipts";
import ReceiptDetail from "./pages/receiptDetails";
import SentSMSPage from "./pages/sentSMS";
import SmsScreen from "./pages/sendSMS";
import SendBillsScreen from "./pages/sendBills";
import DebtManager from "./pages/debtManager";
import ReportScreen from "./pages/reports";
import ComingSoonPage from "./pages/comingSoon";
import CustomerEditScreen from "./pages/editCustomers";
import ForgotPasswordScreen from "./pages/forgotPassword";
import ChangePasswordScreen from "./pages/ChangePasswordScreen";
import VerifyOtpScreen from "./pages/VerifyOtpScreen";
import UserManagementScreen from "./pages/users";
import UserDetails from "./pages/userDetails";
import AddUser from "./pages/addUser";
import Organization from "./pages/orgDetails";
import EditOrganization from "./pages/editOrg";
import AssignTaskScreen from "./pages/createTask";
import FetchTasksScreen from "./pages/fetchTasks";
import TaskDetailsScreen from "./pages/taskDetails";
import BuildingsScreen from "./pages/property";
import BuildingDetailsScreen from "./pages/propertyDetails";
import CreatePropertyAndUnitsScreen from "./pages/addProperty";
import CreateReadingScreen from "./pages/addutilities";
import LandlordsScreen from "./pages/landlords";
import TerminateLease from "./pages/terminateLease";
import LandlordDetailsScreen from "./pages/landlordDetails";
import EditBuildingScreen from "./pages/editBuilding";
import WaterReadingsList from "./pages/waterReadings";
import MeterReadingDetails from "./pages/meterReadingDetails";

const App = () => {
  const { darkMode } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const theme = getTheme(darkMode ? "dark" : "light");

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box
          sx={{
            minHeight: "100vh", // Full viewport height
            width: "100%", // Full width
            backgroundColor: theme.palette.background.default, // Theme background
            display: "flex", // Flexbox for sidebar and content
            flexDirection: "row",
          }}
        >
          {isAuthenticated && <Sidebar />}
          <Box
            sx={{
              flexGrow: 1, // Takes remaining space
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh", // Ensure content fills height
            }}
          >
            {isAuthenticated && <Navbar />}
            <Box
              component="main"
              sx={{
                flexGrow: 1, // Content expands to fill space
                backgroundColor: theme.palette.background.default, // Consistent background
                p: 3, // Padding for content
              }}
            >
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ForgotPasswordScreen />} />
                <Route path="/change-password" element={<ChangePasswordScreen />} />
                <Route path="/verify-otp" element={<VerifyOtpScreen />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <HomeScreen />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute>
                      <CustomersScreen />
                    </ProtectedRoute>
                  }
                />


                  <Route
                  path="/properties"
                  element={
                    <ProtectedRoute>
                      <BuildingsScreen />
                    </ProtectedRoute>
                  }
                /> 

                   <Route
                  path="/add-property"
                  element={
                    <ProtectedRoute>
                      <CreatePropertyAndUnitsScreen />
                    </ProtectedRoute>
                  }
                /> 





                   <Route
                  path="/building-details/:id"
                  element={
                    <ProtectedRoute>
                      <BuildingDetailsScreen />
                    </ProtectedRoute>
                  }
                />


                <Route
                  path="/edit-building/:buildingId"
                  element={
                    <ProtectedRoute>
                      <EditBuildingScreen/>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/invoices"
                  element={
                    <ProtectedRoute>
                      <InvoiceList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-customer"
                  element={
                    <ProtectedRoute>
                      <AddCustomer />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create-invoice"
                  element={
                    <ProtectedRoute>
                      <CreateInvoice />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/get-invoice/:id"
                  element={
                    <ProtectedRoute>
                      <InvoiceDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer-details/:id"
                  element={
                    <ProtectedRoute>
                      <CustomerDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payments"
                  element={
                    <ProtectedRoute>
                      <Payments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payments/:id"
                  element={
                    <ProtectedRoute>
                      <PaymentDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-payment"
                  element={
                    <ProtectedRoute>
                      <CreatePayment />
                    </ProtectedRoute>
                  }
                />


                     <Route
                  path="/water-readings"
                  element={
                    <ProtectedRoute>
                      <WaterReadingsList/>
                    </ProtectedRoute>
                  }
                /> 

                <Route
                  path="/water-reading/:id"
                  element={
                    <ProtectedRoute>
                      <MeterReadingDetails />
                    </ProtectedRoute>
                  }/>


                   <Route
                  path="/landlords"
                  element={
                    <ProtectedRoute>
                      <LandlordsScreen />
                    </ProtectedRoute>
                  }  
                /> 


                  <Route
                  path="/landlord/:id"
                  element={
                    <ProtectedRoute>
                      <LandlordDetailsScreen />
                    </ProtectedRoute>
                  }
                />
                

                

                 <Route
                  path="/terminate-lease/:id"
                  element={
                    <ProtectedRoute>
                      <TerminateLease />
                    </ProtectedRoute>
                  }
                /> 
                <Route
                  path="/receipts"
                  element={
                    <ProtectedRoute>
                      <Receipts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/receipts/:id"
                  element={
                    <ProtectedRoute>
                      <ReceiptDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sent-sms"
                  element={
                    <ProtectedRoute>
                      <SentSMSPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/send-sms"
                  element={
                    <ProtectedRoute>
                      <SmsScreen />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/send-bills"
                  element={
                    <ProtectedRoute>
                      <SendBillsScreen />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/debt-management"
                  element={
                    <ProtectedRoute>
                      <DebtManager />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/view-reports"
                  element={
                    <ProtectedRoute>
                      <ReportScreen />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/request-custom-reports"
                  element={
                    <ProtectedRoute>
                      <ComingSoonPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer-edit/:id"
                  element={
                    <ProtectedRoute>
                      <CustomerEditScreen />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute>
                      <UserManagementScreen />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-user"
                  element={
                    <ProtectedRoute>
                      <AddUser />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user/:id"
                  element={
                    <ProtectedRoute>
                      <UserDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/org-details"
                  element={
                    <ProtectedRoute>
                      <Organization />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organization/edit"
                  element={
                    <ProtectedRoute>
                      <EditOrganization />
                    </ProtectedRoute>
                  }
                />


                  <Route
                  path="tasks/create"
                  element={
                    <ProtectedRoute>
                      <AssignTaskScreen />
                    </ProtectedRoute>
                  }
                />

                  <Route
                  path="tasks"
                  element={
                    <ProtectedRoute>
                      <FetchTasksScreen />
                    </ProtectedRoute>
                  }
                />  

<Route
                  path="task-details/:taskId"
                  element={
                    <ProtectedRoute>
                      <TaskDetailsScreen />
                    </ProtectedRoute>
                  }
                />  
              </Routes>
            </Box>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;
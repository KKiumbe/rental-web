import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import { useAuthStore, useThemeStore } from "./store/authStore";
import { getTheme } from "./store/theme";

import HomeScreen from "./pages/home";
import Login from "./pages/auth/login";

import ProtectedRoute from "./ProtectedRoute";
import Navbar from "./global/navbar";
import Sidebar from "./global/sidebar";
import CustomersScreen from "./pages/customers/customers";
import InvoiceList from "./pages/invoices/Invoices";
import AddCustomer from "./pages/customers/addCustomers";
import CreateInvoice from "./pages/invoices/createInvoice";
import InvoiceDetails from "./pages/invoices/InvoiceDetail";
import CustomerDetails from "./pages/customers/customerDetails";
import Payments from "./pages/payments/payments";
import PaymentDetails from "./pages/payments/PaymentDetail";
import CreatePayment from "./pages/payments/addPayment";
import Receipts from "./pages/payments/receipts/receipts";
import ReceiptDetail from "./pages/payments/receipts/receiptDetails";
import SentSMSPage from "./pages/sms/sentSMS";
import SmsScreen from "./pages/sms/sendSMS";
import SendBillsScreen from "./pages/sms/sendBills";
import DebtManager from "./pages/sms/debtManager";
import ReportScreen from "./pages/reports/reports";
import ComingSoonPage from "./pages/comingSoon";
import CustomerEditScreen from "./pages/customers/editCustomers";
import ForgotPasswordScreen from "./pages/auth/forgotPassword";
import ChangePasswordScreen from "./pages/auth/ChangePasswordScreen";
import VerifyOtpScreen from "./pages/auth/VerifyOtpScreen";
import UserManagementScreen from "./pages/users/users";
import UserDetails from "./pages/users/userDetails";
import AddUser from "./pages/users/addUser";
import Organization from "./pages/org/orgDetails";
import EditOrganization from "./pages/org/editOrg";
import AssignTaskScreen from "./pages/tasks/createTask";
import FetchTasksScreen from "./pages/tasks/fetchTasks";
import TaskDetailsScreen from "./pages/tasks/taskDetails";
import BuildingsScreen from "./pages/property/property";
import BuildingDetailsScreen from "./pages/property/propertyDetails";
import LandlordsScreen from "./pages/landlord/landlords";
import TerminateLease from "./pages/customers/terminateLease";
import LandlordDetailsScreen from "./pages/landlord/landlordDetails";
import EditBuildingScreen from "./pages/property/editBuilding";
import WaterReadingsList from "./pages/utility/meterReading/waterReadings";
import MeterReadingDetails from "./pages/utility/meterReading/meterReadingDetails";
import AddPropertyScreen from "./pages/property/addProperty";
import AddUnitScreen from "./pages/property/addUnit";
import CreateWaterReading from "./pages/meterReadings/addReadings";
import ExpensesScreen from "./pages/property/getAllPropertyExpenses";

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
                      <AddPropertyScreen />
                    </ProtectedRoute>
                  }
                /> 
              
                <Route
                  path="/add-unit/:buildingId"
                  element={
                    <ProtectedRoute>
                      <AddUnitScreen />
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
                  path="/water-readings/create"
                  element={
                    <ProtectedRoute>
                      <CreateWaterReading/>
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

                <Route 
                path="/expenses" 
                element={<ProtectedRoute>
                      < ExpensesScreen/>
                    </ProtectedRoute>}/>

                <Route
                  path="/utility/gas"
                  element={
                    <ProtectedRoute>
                      <ComingSoonPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/utility/electricity"
                  element={
                    <ProtectedRoute>
                      <ComingSoonPage />
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
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import "./styles/modern.css";
import React from "react";
import ModernHome from "./components/ModernHome";
import About from "./components/About";
import ModernNavbar from "./components/ModernNavbar";
import Footer from "./components/Footer";
import Faq from "./components/FAQ";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import { ContextProvider } from "./context/StepContext";
import { AuthProvider } from "./context/AuthContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import ModernChat from "./components/ModernChat";
import UnifiedWorkspace from "./components/UnifiedWorkspace";
import TemplateManager from "./components/TemplateManager";
import TemplateUploader from "./components/TemplateUploader";
import AskLawyerChat from "./components/AskLawyerChat";
import DocumentAnalyzerPanel from "./components/DocumentAnalyzerPanel";
import ContractReviewPanel from "./components/ContractReviewPanel";
import ClauseSearchPanel from "./components/ClauseSearchPanel";
import LegalResearchPanel from "./components/LegalResearchPanel";

function AppContent() {
  const location = useLocation();
  const isWorkspace = location.pathname === '/workspace';
  const isQuickAction = location.pathname.startsWith('/quick-actions');

  return (
    <>
      {!isWorkspace && !isQuickAction && <ModernNavbar />}
      {!isWorkspace && !isQuickAction && <ModernChat />}
      <Routes>
        <Route path="/" element={<ModernHome />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workspace" element={<UnifiedWorkspace />} />
        <Route path="/templates" element={<TemplateManager />} />
        <Route path="/templates/upload" element={<TemplateUploader />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/quick-actions/ask-lawyer" element={<AskLawyerChat />} />
        <Route path="/quick-actions/document-analyzer" element={<DocumentAnalyzerPanel />} />
        <Route path="/quick-actions/contract-review" element={<ContractReviewPanel />} />
        <Route path="/quick-actions/clause-search" element={<ClauseSearchPanel />} />
        <Route path="/quick-actions/legal-research" element={<LegalResearchPanel />} />
      </Routes>
      <ToastContainer />
      {!isWorkspace && !isQuickAction && <Footer />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ContextProvider>
        <WorkspaceProvider>
          <Router>
            <AppContent />
          </Router>
        </WorkspaceProvider>
      </ContextProvider>
    </AuthProvider>
  );
}

export default App;

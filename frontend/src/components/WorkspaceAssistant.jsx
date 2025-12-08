import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { toast } from 'react-toastify';
import './WorkspaceAssistant.css';

// Simple markdown-like formatter
const formatMessage = (text) => {
  if (!text) return '';
  
  // Convert markdown to HTML
  let formatted = text
    // Bold **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Headers ### text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Horizontal rules ---
    .replace(/^---$/gim, '<hr/>')
    // Lists - item
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  
  // Wrap lists in ul tags
  formatted = formatted.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  
  // Wrap in paragraph if not already wrapped
  if (!formatted.startsWith('<h') && !formatted.startsWith('<ul')) {
    formatted = '<p>' + formatted + '</p>';
  }
  
  return formatted;
};

const WorkspaceAssistant = () => {
  const location = useLocation();
  const {
    document,
    setDocument,
    documentType,
    setDocumentType,
    documentId,
    setDocumentId,
    conversationHistory,
    addToConversation,
    sessionId,
    setWorkflowStage,
    setIsGenerating,
    extractedFields,
    setExtractedFields,
    setMissingFields
  } = useWorkspace();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [currentStage, setCurrentStage] = useState('ready'); // ready, analyzing, template_selected, gathering_info, generating
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasProcessedInitialPrompt = useRef(false);

  // Handle initial prompt from PromptModal
  useEffect(() => {
    const initialPrompt = location.state?.initialPrompt;
    const selectedTemplate = location.state?.selectedTemplate;
    
    if (initialPrompt && conversationHistory.length === 1 && currentStage === 'ready' && !hasProcessedInitialPrompt.current) {
      hasProcessedInitialPrompt.current = true;
      // If a specific template was selected in PromptModal, use it directly
      if (selectedTemplate && selectedTemplate.templateName) {
        setCurrentStage('analyzing');
        
        // Set the template directly without analyzing intent
        const template = {
          id: selectedTemplate.templateId,
          name: selectedTemplate.templateName,
          description: 'User-selected template',
          isUserTemplate: selectedTemplate.isUserTemplate
        };
        
        setSelectedTemplate(template);
        setDocumentType(template.name);
        setCurrentStage('template_selected');

        const templateMessage = `Great! I'll help you create a **${template.name}**.

${template.isUserTemplate ? 'Using your custom template' : 'For ' + (selectedTemplate.templateName.toLowerCase().includes('notice') ? 'legal notices' : 'document creation')}

Let me analyze your request to extract the information you've already provided...`;

        addToConversation('assistant', templateMessage);
        
        // Proceed with smart extraction
        handleSmartExtraction(initialPrompt, template);
      } else {
        // No template selected, analyze intent
        setCurrentStage('analyzing');
        analyzeIntent(initialPrompt);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, conversationHistory.length]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Smart extraction function (reusable)
  const handleSmartExtraction = async (userPrompt, template) => {
    setIsTyping(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/document/smart-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: userPrompt,
          template_name: template.name
        })
      });

      if (!response.ok) {
        throw new Error('Smart extraction failed');
      }

      const extractionData = await response.json();
      
      if (extractionData.success) {
        const { extracted_fields, missing_fields, confidence, tokens_used } = extractionData;
        
        console.log(`✅ Smart extraction completed | Confidence: ${confidence} | Tokens: ${tokens_used}`);
        
        // Update extracted fields in context
        setExtractedFields(extracted_fields);
        setMissingFields(missing_fields);
        
        // Filter out null/empty values for display
        const validExtractedFields = Object.entries(extracted_fields).filter(([_, value]) => 
          value !== null && value !== '' && value !== 'null' && value !== undefined
        );
        
        // Show what was extracted
        const extractedCount = validExtractedFields.length;
        const missingCount = missing_fields.length;
        
        let feedbackMessage = '';
        
        if (extractedCount > 0) {
          feedbackMessage += `Perfect! I've extracted **${extractedCount} field${extractedCount > 1 ? 's' : ''}** from your request:\n\n`;
          
          // Show extracted fields in a nice format (only non-null values)
          validExtractedFields.forEach(([field, value]) => {
            const readableField = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            feedbackMessage += `- **${readableField}:** ${value}\n`;
          });
          feedbackMessage += '\n';
        }
        
        if (missingCount > 0) {
          feedbackMessage += `I just need a few more details to complete your document. Let me ask you about them...`;
          
          addToConversation('assistant', feedbackMessage);
          
          // Ask only for missing fields
          setTimeout(() => {
            setCurrentStage('gathering_info');
            askNextQuestion(template, extracted_fields);
          }, 1000);
        } else {
          feedbackMessage += `Amazing! You've provided all the necessary information. Let me generate your document now...`;
          addToConversation('assistant', feedbackMessage);
          
          // All fields provided, generate immediately
          setCurrentStage('generating');
          setTimeout(() => generateDocument(template, extracted_fields), 1500);
        }
      } else {
        throw new Error('Extraction returned no data');
      }
      
    } catch (extractionError) {
      console.error('Smart extraction error:', extractionError);
      // Fallback to asking all questions
      addToConversation('assistant', 'To create your document, I need some information from you. Let me ask you a few questions.');
      
      setTimeout(() => {
        setCurrentStage('gathering_info');
        askNextQuestion(template, {});
      }, 1000);
    } finally {
      setIsTyping(false);
    }
  };

  // Analyze user's intent and select template
  const analyzeIntent = async (userPrompt) => {
    setIsTyping(true);
    setCurrentStage('analyzing');

    try {
      // Step 1: Detect template using keyword matching (local, free)
      const prompt = userPrompt.toLowerCase();
      
      let template = null;
      if (prompt.includes('rental') || prompt.includes('lease') || prompt.includes('rent') || prompt.includes('tenancy')) {
        template = { id: 1, name: 'Lease Agreement', description: 'For residential or commercial property leases' };
      } else if (prompt.includes('employment') || prompt.includes('job') || prompt.includes('hire') || prompt.includes('employee')) {
        template = { id: 2, name: 'Employment Contract', description: 'For hiring employees' };
      } else if (prompt.includes('partnership') || prompt.includes('business partners') || prompt.includes('partner')) {
        template = { id: 3, name: 'Partnership Deed', description: 'For business partnerships' };
      } else if (prompt.includes('nda') || prompt.includes('non-disclosure') || prompt.includes('confidential')) {
        template = { id: 4, name: 'NDA', description: 'For protecting confidential information' };
      } else if (prompt.includes('bond') || prompt.includes('indemnity') || prompt.includes('surety') || prompt.includes('guarantee')) {
        template = { id: 5, name: 'Bond Agreement', description: 'For bond/indemnity/guarantee agreements' };
      } else if (prompt.includes('legal notice') && (prompt.includes('money') || prompt.includes('recovery') || prompt.includes('payment'))) {
        template = { id: 6, name: 'Legal Notice for Recovery of Money', description: 'For recovering outstanding payments' };
      } else if (prompt.includes('legal notice') && prompt.includes('invoice')) {
        template = { id: 7, name: 'Legal Notice for Non-Payment of Invoice', description: 'For unpaid invoices' };
      } else if (prompt.includes('legal notice') && (prompt.includes('loan') || prompt.includes('friendly'))) {
        template = { id: 8, name: 'Legal Notice for Recovery of Friendly Loan', description: 'For personal loan recovery' };
      } else if (prompt.includes('trust') || prompt.includes('family trust') || prompt.includes('deed of trust')) {
        template = { id: 9, name: 'Family Trust Deed', description: 'For creating a family trust' };
      } else {
        // If unclear, ask user to specify
        addToConversation('assistant', `I'd like to help you create a document. Could you please specify what type?\n\n**Available templates:**\n\n📄 **Lease Agreement** - rental/property lease\n💼 **Employment Contract** - hiring employees\n🤝 **Partnership Deed** - business partnership\n🔒 **NDA** - confidentiality agreement\n📝 **Bond Agreement** - bond/indemnity\n⚖️ **Legal Notice for Recovery of Money** - payment recovery\n📋 **Legal Notice for Non-Payment of Invoice** - invoice dues\n💰 **Legal Notice for Recovery of Friendly Loan** - loan recovery\n🏛️ **Family Trust Deed** - family trust creation\n\nPlease tell me which one you need, or describe your document in more detail.`);
        setIsTyping(false);
        return;
      }

      setSelectedTemplate(template);
      setDocumentType(template.name);
      setCurrentStage('template_selected');

      const templateMessage = `Great! I'll help you create a **${template.name}**.

${template.description}

Let me analyze your request to extract the information you've already provided...`;

      addToConversation('assistant', templateMessage);

      // Step 2: Smart extraction using handleSmartExtraction
      handleSmartExtraction(userPrompt, template);

    } catch (error) {
      console.error('Intent analysis error:', error);
      addToConversation('assistant', 'I encountered an error analyzing your request. Could you please clarify what type of document you need?');
      setCurrentStage('ready');
    } finally {
      setIsTyping(false);
    }
  };

  // Ask questions based on template
  const askNextQuestion = (template, currentFields) => {
    const questions = getQuestionsForTemplate(template);
    const answeredQuestions = Object.keys(currentFields);
    
    const nextQuestion = questions.find(q => !answeredQuestions.includes(q.field));
    
    if (nextQuestion) {
      addToConversation('assistant', nextQuestion.question, { asking_for: nextQuestion.field });
    } else {
      // All questions answered, generate document
      addToConversation('assistant', 'Perfect! I have all the information I need. Let me generate your document now...');
      setCurrentStage('generating');
      setTimeout(() => generateDocument(template, currentFields), 1000);
    }
  };

  // Get questions for each template type
  const getQuestionsForTemplate = (template) => {
    // Add null safety check
    if (!template || !template.name) {
      console.error('Invalid template provided to getQuestionsForTemplate:', template);
      return [];
    }
    
    if (template.name.includes('Lease') || template.name.includes('Rental')) {
      return [
        { field: 'lessor_name', question: 'What is the landlord\'s (lessor\'s) full name?' },
        { field: 'lessor_address', question: 'What is the landlord\'s complete address?' },
        { field: 'lessee_name', question: 'What is the tenant\'s (lessee\'s) full name?' },
        { field: 'lessee_address', question: 'What is the tenant\'s complete address?' },
        { field: 'property_address', question: 'What is the complete property address to be leased?' },
        { field: 'property_description', question: 'Please describe the property (e.g., 2BHK, 1200 sq ft)' },
        { field: 'monthly_rent', question: 'What is the monthly rent amount (in ₹)?' },
        { field: 'lease_duration_years', question: 'What is the lease duration in years? (e.g., 1, 2)' },
        { field: 'lease_start_date', question: 'What is the lease start date? (format: YYYY-MM-DD, e.g., 2024-01-01)' },
        { field: 'location', question: 'In which city/location is this agreement being made?' },
        { field: 'day', question: 'What day of the month is the agreement being made? (e.g., 15)' },
        { field: 'month', question: 'What month is the agreement being made? (e.g., January)' },
        { field: 'year', question: 'What year is the agreement being made? (e.g., 2024)' },
        { field: 'payment_day', question: 'On which day of the month should rent be paid? (e.g., 5)' },
        { field: 'first_payment_date', question: 'When is the first rent payment due? (format: YYYY-MM-DD)' },
        { field: 'lessor_witness_1', question: 'What is the name of the first witness for the landlord?' },
        { field: 'lessor_witness_2', question: 'What is the name of the second witness for the landlord?' },
        { field: 'lessee_witness_1', question: 'What is the name of the first witness for the tenant?' },
        { field: 'lessee_witness_2', question: 'What is the name of the second witness for the tenant?' }
      ];
    } else if (template.name.includes('Employment')) {
      return [
        { field: 'employer_name', question: 'What is the company/employer name?' },
        { field: 'employee_name', question: 'What is the employee\'s full name?' },
        { field: 'position', question: 'What is the job position/title?' },
        { field: 'salary', question: 'What is the monthly salary (in ₹)?' },
        { field: 'start_date', question: 'What is the employment start date? (e.g., 2024-01-15)' },
        { field: 'probation_period', question: 'What is the probation period? (e.g., 3 months, 6 months)' }
      ];
    } else if (template.name.includes('NDA')) {
      return [
        { field: 'day', question: 'What day of the month is the agreement being made? (e.g., 15)' },
        { field: 'month', question: 'What month is the agreement being made? (e.g., January)' },
        { field: 'year', question: 'What year is the agreement being made? (e.g., 2025)' },
        { field: 'party_1_name', question: 'What is the first party\'s full legal name? (e.g., ABC Technologies Pvt. Ltd.)' },
        { field: 'party_1_address', question: 'What is the first party\'s complete registered address?' },
        { field: 'party_2_name', question: 'What is the second party\'s (customer\'s) full legal name?' },
        { field: 'party_2_address', question: 'What is the second party\'s complete address?' },
        { field: 'proposed_transaction_details', question: 'What is the purpose/details of the proposed transaction or collaboration?' },
        { field: 'termination_years', question: 'How many years after termination of binding agreement should confidentiality continue? (e.g., 2)' },
        { field: 'expiry_years', question: 'How many years after expiry of binding agreement should confidentiality continue? (e.g., 3)' }
      ];
    } else if (template.name.includes('Bond')) {
      return [
        { field: 'principal_name', question: 'What is the principal\'s full name (person being bonded)?' },
        { field: 'principal_address', question: 'What is the principal\'s address?' },
        { field: 'surety_name', question: 'What is the surety\'s full name (guarantor/partner)?' },
        { field: 'surety_address', question: 'What is the surety\'s address?' },
        { field: 'bond_amount', question: 'What is the bond amount (in ₹)?' },
        { field: 'purpose', question: 'What is the purpose of this bond? (e.g., performance bond, indemnity)' },
        { field: 'effective_date', question: 'What is the effective date? (e.g., 2024-01-01)' },
        { field: 'expiry_date', question: 'When does this bond expire? (e.g., 2025-12-31)' },
        { field: 'conditions', question: 'Any specific conditions or terms for this bond?' }
      ];
    } else if (template.name.includes('Partnership')) {
      return [
        { field: 'partner1_name', question: 'What is the first partner\'s full name?' },
        { field: 'partner1_address', question: 'What is the first partner\'s address?' },
        { field: 'partner2_name', question: 'What is the second partner\'s full name?' },
        { field: 'partner2_address', question: 'What is the second partner\'s address?' },
        { field: 'business_name', question: 'What is the business/partnership name?' },
        { field: 'business_address', question: 'What is the business address?' },
        { field: 'capital_contribution', question: 'What are the capital contributions from each partner?' },
        { field: 'profit_sharing', question: 'How will profits be shared? (e.g., 50-50, 60-40)' },
        { field: 'effective_date', question: 'What is the partnership start date? (e.g., 2024-01-01)' },
        { field: 'duration', question: 'What is the partnership duration? (e.g., 5 years, indefinite)' }
      ];
    } else if (template.name.includes('Legal Notice for Recovery of Money')) {
      return [
        { field: 'recipient_name', question: 'What is the recipient\'s full name?' },
        { field: 'recipient_address', question: 'What is the recipient\'s address?' },
        { field: 'client_name', question: 'What is your company/individual name?' },
        { field: 'client_full_name', question: 'What is your full legal name?' },
        { field: 'business_nature', question: 'What is the nature of your business?' },
        { field: 'principal_amount', question: 'What is the principal outstanding amount (₹)?' },
        { field: 'interest_rate', question: 'What is the interest rate (% per annum)?' },
        { field: 'total_payable', question: 'What is the total amount payable including interest (₹)?' },
        { field: 'advocate_name', question: 'What is your advocate\'s name?' }
      ];
    } else if (template.name.includes('Legal Notice for Non-Payment of Invoice')) {
      return [
        { field: 'recipient_name', question: 'What is the recipient\'s full name?' },
        { field: 'recipient_address', question: 'What is the recipient\'s address?' },
        { field: 'client_name', question: 'What is your company/individual name?' },
        { field: 'client_full_name', question: 'What is your full legal name?' },
        { field: 'business_nature', question: 'What is the nature of your business?' },
        { field: 'principal_amount', question: 'What is the invoice amount (₹)?' },
        { field: 'interest_rate', question: 'What is the interest rate (% per annum)?' },
        { field: 'total_payable', question: 'What is the total payable including interest (₹)?' },
        { field: 'advocate_name', question: 'What is your advocate\'s name?' }
      ];
    } else if (template.name.includes('Legal Notice for Recovery of Friendly Loan')) {
      return [
        { field: 'recipient_name', question: 'What is the borrower\'s full name?' },
        { field: 'recipient_address', question: 'What is the borrower\'s address?' },
        { field: 'client_name', question: 'What is your name (lender)?' },
        { field: 'client_full_name', question: 'What is your full legal name?' },
        { field: 'principal_amount', question: 'What is the loan amount (₹)?' },
        { field: 'interest_rate', question: 'What is the interest rate (% per annum)?' },
        { field: 'total_payable', question: 'What is the total payable including interest (₹)?' },
        { field: 'advocate_name', question: 'What is your advocate\'s name?' }
      ];
    } else if (template.name.includes('Family Trust')) {
      return [
        { field: 'trust_location', question: 'Where is this trust deed being made? (city)' },
        { field: 'trust_name', question: 'What is the name of the trust?' },
        { field: 'settlor1_name', question: 'What is the first settlor\'s full name?' },
        { field: 'settlor2_name', question: 'What is the second settlor\'s full name?' },
        { field: 'trustee1_name', question: 'What is the first trustee\'s full name?' },
        { field: 'trustee2_name', question: 'What is the second trustee\'s full name?' },
        { field: 'family_name', question: 'What is the family name/surname?' },
        { field: 'property_location', question: 'Where is the property located?' },
        { field: 'deity_name', question: 'What is the family deity\'s name?' },
        { field: 'trust_fund_amount', question: 'What is the initial trust fund amount (₹)?' }
      ];
    } else {
      return [
        { field: 'party1_name', question: 'What is the name of the first party?' },
        { field: 'party2_name', question: 'What is the name of the second party?' },
        { field: 'agreement_subject', question: 'What is the subject/purpose of this agreement?' },
        { field: 'effective_date', question: 'What is the effective date of this agreement?' }
      ];
    }
  };

  // Generate the document
  const generateDocument = async (template, fields) => {
    setIsGenerating(true);
    setWorkflowStage('generate');
    setIsTyping(true);

    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('token');
      
      // Call backend API to generate document from Jinja2 template
      const response = await fetch('http://localhost:5000/api/document/generate-from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          template_name: template.name,
          field_values: fields,
          format: 'html'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const data = await response.json();
      
      if (data.success && data.html_content) {
        setDocument(data.html_content);
        
        // Store document_id if available
        if (data.document_id) {
          setDocumentId(data.document_id);
          console.log(`📄 Document ID stored: ${data.document_id}`);
        }
        
        setWorkflowStage('edit');
        
        const successMessage = `🎉 Your **${template.name}** is ready!

I've generated the document on the left. You can now:
• Review the content
• Make any edits using the editor
• Validate the document for legal compliance
• Export it in your preferred format

Is there anything you'd like me to adjust?`;

        addToConversation('assistant', successMessage);
        toast.success('Document generated successfully!');
        setCurrentStage('ready');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Generation error:', error);
      
      // Fallback to local template generation if backend fails
      console.log('Falling back to local template generation...');
      const generatedContent = createDocumentFromTemplate(template, fields);
      setDocument(generatedContent);
      setWorkflowStage('edit');
      
      addToConversation('assistant', `⚠️ Generated document using fallback template. For best results, please ensure the backend server is running.

Your **${template.name}** is ready for review!`);
      toast.warning('Generated using fallback template');
      setCurrentStage('ready');
    } finally {
      setIsGenerating(false);
      setIsTyping(false);
    }
  };

  // Create document content from template
  const createDocumentFromTemplate = (template, fields) => {
    if (template.name.includes('Lease') || template.name.includes('Rental')) {
      return `<h1>RENTAL/LEASE AGREEMENT</h1>
<p>This Rental Agreement is entered into on <strong>${fields.start_date || '[START_DATE]'}</strong></p>

<h2>BETWEEN:</h2>
<p><strong>LANDLORD:</strong> ${fields.landlord_name || '[LANDLORD_NAME]'}</p>
<p><strong>TENANT:</strong> ${fields.tenant_name || '[TENANT_NAME]'}</p>

<h2>PROPERTY DETAILS:</h2>
<p><strong>Address:</strong> ${fields.property_address || '[PROPERTY_ADDRESS]'}</p>
<p><strong>Type:</strong> ${fields.property_type || 'Residential/Commercial'}</p>

<h2>TERMS:</h2>
<ol>
  <li><strong>Rent:</strong> ₹${fields.rent_amount || '[RENT_AMOUNT]'} per month</li>
  <li><strong>Security Deposit:</strong> ₹${fields.security_deposit || '[SECURITY_DEPOSIT]'}</li>
  <li><strong>Lease Duration:</strong> ${fields.lease_duration || '[LEASE_DURATION]'}</li>
  <li><strong>Payment Due:</strong> ${fields.payment_due_date || '5th day of each month'}</li>
  <li><strong>Maintenance:</strong> The tenant shall keep the premises in good condition.</li>
  <li><strong>Termination:</strong> Either party may terminate with 30 days written notice.</li>
</ol>

<h2>SIGNATURES:</h2>
<p><strong>Landlord:</strong> _____________________</p>
<p><strong>Tenant:</strong> _____________________</p>
<p><strong>Date:</strong> _____________________</p>`;
    } else if (template.name.includes('Employment')) {
      return `<h1>EMPLOYMENT CONTRACT</h1>
<p>This Employment Contract is made on <strong>${fields.start_date || '[START_DATE]'}</strong></p>

<h2>BETWEEN:</h2>
<p><strong>EMPLOYER:</strong> ${fields.company_name || '[COMPANY_NAME]'}</p>
<p><strong>EMPLOYEE:</strong> ${fields.employee_name || '[EMPLOYEE_NAME]'}</p>

<h2>POSITION:</h2>
<p><strong>Job Title:</strong> ${fields.position || '[POSITION]'}</p>

<h2>TERMS OF EMPLOYMENT:</h2>
<ol>
  <li><strong>Salary:</strong> ₹${fields.salary || '[SALARY]'} per month</li>
  <li><strong>Probation Period:</strong> ${fields.probation_period || '[PROBATION_PERIOD]'}</li>
  <li><strong>Working Hours:</strong> As per company policy</li>
  <li><strong>Leave:</strong> As per company policy and applicable labor laws</li>
  <li><strong>Confidentiality:</strong> Employee shall maintain confidentiality of company information</li>
  <li><strong>Termination:</strong> Either party may terminate with appropriate notice as per law</li>
</ol>

<h2>SIGNATURES:</h2>
<p><strong>Employer:</strong> _____________________</p>
<p><strong>Employee:</strong> _____________________</p>
<p><strong>Date:</strong> _____________________</p>`;
    } else if (template.name.includes('Bond')) {
      return `<h1>BOND AGREEMENT</h1>
<p>This Bond Agreement is executed on <strong>${fields.effective_date || '[EFFECTIVE_DATE]'}</strong></p>

<h2>BETWEEN:</h2>
<p><strong>PRINCIPAL:</strong> ${fields.principal_name || '[PRINCIPAL_NAME]'}</p>
<p><strong>Address:</strong> ${fields.principal_address || '[PRINCIPAL_ADDRESS]'}</p>

<h2>AND:</h2>
<p><strong>SURETY:</strong> ${fields.surety_name || '[SURETY_NAME]'}</p>
<p><strong>Address:</strong> ${fields.surety_address || '[SURETY_ADDRESS]'}</p>

<h2>BOND DETAILS:</h2>
<ol>
  <li><strong>Bond Amount:</strong> ₹${fields.bond_amount || '[BOND_AMOUNT]'}</li>
  <li><strong>Purpose:</strong> ${fields.purpose || '[PURPOSE]'}</li>
  <li><strong>Effective Date:</strong> ${fields.effective_date || '[EFFECTIVE_DATE]'}</li>
  <li><strong>Expiry Date:</strong> ${fields.expiry_date || '[EXPIRY_DATE]'}</li>
  <li><strong>Conditions:</strong> ${fields.conditions || 'Standard bond conditions apply'}</li>
</ol>

<h2>TERMS:</h2>
<ol>
  <li>The Surety hereby binds themselves to the Principal for the amount stated above.</li>
  <li>This bond shall remain in effect until ${fields.expiry_date || '[EXPIRY_DATE]'}.</li>
  <li>The Surety's liability under this bond shall not exceed the bond amount.</li>
  <li>This bond is subject to the laws of India.</li>
</ol>

<h2>SIGNATURES:</h2>
<p><strong>Principal:</strong> _____________________</p>
<p><strong>Surety:</strong> _____________________</p>
<p><strong>Witness:</strong> _____________________</p>
<p><strong>Date:</strong> _____________________</p>`;
    } else if (template.name.includes('Partnership')) {
      return `<h1>PARTNERSHIP DEED</h1>
<p>This Partnership Deed is made on <strong>${fields.effective_date || '[EFFECTIVE_DATE]'}</strong></p>

<h2>BETWEEN:</h2>
<p><strong>PARTNER 1:</strong> ${fields.partner1_name || '[PARTNER_1_NAME]'}</p>
<p><strong>Address:</strong> ${fields.partner1_address || '[PARTNER_1_ADDRESS]'}</p>

<h2>AND:</h2>
<p><strong>PARTNER 2:</strong> ${fields.partner2_name || '[PARTNER_2_NAME]'}</p>
<p><strong>Address:</strong> ${fields.partner2_address || '[PARTNER_2_ADDRESS]'}</p>

<h2>BUSINESS DETAILS:</h2>
<p><strong>Business Name:</strong> ${fields.business_name || '[BUSINESS_NAME]'}</p>
<p><strong>Business Address:</strong> ${fields.business_address || '[BUSINESS_ADDRESS]'}</p>

<h2>TERMS OF PARTNERSHIP:</h2>
<ol>
  <li><strong>Capital Contribution:</strong> ${fields.capital_contribution || '[CAPITAL_CONTRIBUTION]'}</li>
  <li><strong>Profit Sharing:</strong> ${fields.profit_sharing || '[PROFIT_SHARING]'}</li>
  <li><strong>Duration:</strong> ${fields.duration || '[DURATION]'}</li>
  <li><strong>Management:</strong> Partners shall jointly manage the business.</li>
  <li><strong>Banking:</strong> All banking transactions require signatures of both partners.</li>
  <li><strong>Dissolution:</strong> Partnership may be dissolved by mutual consent or as per law.</li>
</ol>

<h2>SIGNATURES:</h2>
<p><strong>Partner 1:</strong> _____________________</p>
<p><strong>Partner 2:</strong> _____________________</p>
<p><strong>Witness:</strong> _____________________</p>
<p><strong>Date:</strong> _____________________</p>`;
    } else {
      return `<h1>LEGAL AGREEMENT</h1>
<p>This Agreement is made on <strong>${fields.effective_date || '[DATE]'}</strong></p>

<h2>BETWEEN:</h2>
<p><strong>PARTY 1:</strong> ${fields.party1_name || '[PARTY_1_NAME]'}</p>
<p><strong>PARTY 2:</strong> ${fields.party2_name || '[PARTY_2_NAME]'}</p>

<h2>SUBJECT:</h2>
<p>${fields.agreement_subject || '[AGREEMENT_SUBJECT]'}</p>

<h2>TERMS AND CONDITIONS:</h2>
<ol>
  <li>Both parties agree to the terms stated herein.</li>
  <li>This agreement shall be governed by Indian law.</li>
  <li>Any disputes shall be resolved through arbitration.</li>
</ol>

<h2>SIGNATURES:</h2>
<p><strong>Party 1:</strong> _____________________</p>
<p><strong>Party 2:</strong> _____________________</p>
<p><strong>Date:</strong> _____________________</p>`;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    addToConversation('user', userMessage);

    // Check current stage and handle accordingly
    if (currentStage === 'ready' && !document) {
      // User is starting a new conversation
      analyzeIntent(userMessage);
    } else if (currentStage === 'gathering_info') {
      // User is answering questions
      handleUserResponse(userMessage);
    } else if (document) {
      // Document exists, check if user wants to refine it
      handleDocumentRefinement(userMessage);
    } else {
      // General query
      handleGeneralQuery(userMessage);
    }
  };

  const handleUserResponse = (response) => {
    setIsTyping(true);

    // Get the last AI message to see what we were asking for
    const lastAiMessage = conversationHistory
      .filter(m => m.role === 'assistant')
      .pop();

    const askingFor = lastAiMessage?.asking_for;

    if (askingFor) {
      // Update extracted fields
      const updatedFields = {
        ...extractedFields,
        [askingFor]: response
      };
      setExtractedFields(updatedFields);

      // Acknowledge
      addToConversation('assistant', '✓ Got it!');

      // Ask next question
      setTimeout(() => {
        askNextQuestion(selectedTemplate, updatedFields);
        setIsTyping(false);
      }, 500);
    } else {
      setIsTyping(false);
    }
  };

  const handleDocumentRefinement = async (userMessage) => {
    setIsTyping(true);

    try {
      // Check if user is asking for document summary or analysis
      const isSummaryRequest = userMessage.toLowerCase().includes('summary') || 
                               userMessage.toLowerCase().includes('summarize') ||
                               userMessage.toLowerCase().includes('overview') ||
                               userMessage.toLowerCase().includes('what does') ||
                               userMessage.toLowerCase().includes('explain');

      const isRefinement = userMessage.toLowerCase().includes('change') || 
                          userMessage.toLowerCase().includes('update') ||
                          userMessage.toLowerCase().includes('modify') ||
                          userMessage.toLowerCase().includes('add') ||
                          userMessage.toLowerCase().includes('remove');

      if (isSummaryRequest || isRefinement) {
        // Send document context along with the query
        await handleDocumentContextQuery(userMessage, isSummaryRequest);
      } else {
        // General query about the document
        await handleGeneralQuery(userMessage);
      }
    } catch (error) {
      console.error('Refinement error:', error);
      addToConversation('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleDocumentContextQuery = async (query, isSummary) => {
    try {
      // Strip HTML tags from document for context
      const documentText = document.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      const response = await fetch('http://127.0.0.1:5000/api/chat/document-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_query: query,
          document_content: documentText,
          document_type: documentType,
          query_type: isSummary ? 'summary' : 'refinement',
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      if (data.success && data.response) {
        addToConversation('assistant', data.response);
      } else {
        // Fallback to simple response
        if (isSummary) {
          const wordCount = documentText.split(' ').length;
          addToConversation('assistant', `This is a **${documentType}** with approximately ${wordCount} words. You can make edits directly in the document editor on the left, or ask me specific questions about the content.`);
        } else {
          addToConversation('assistant', 'I\'ve noted your request. You can make edits directly in the document editor on the left, or I can help you with specific changes. What would you like to modify?');
        }
      }
    } catch (error) {
      console.error('Document context query error:', error);
      addToConversation('assistant', 'I can see your document. You can edit it directly in the editor on the left, or ask me specific questions about it.');
    }
  };

  const handleGeneralQuery = async (query) => {
    setIsTyping(true);

    try {
      // Use RAG chat for general questions
      const response = await fetch('http://127.0.0.1:5000/api/chat/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_chat: query,
          session_id: sessionId,
          n_results: 3
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      if (data.result) {
        addToConversation('assistant', data.result.response, {
          sources: data.result.sources,
          used_rag: data.result.used_rag
        });
      }
    } catch (error) {
      console.error('Query error:', error);
      addToConversation('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  // Quick actions removed - not currently used in UI
  // Can be re-enabled when needed

  return (
    <div className="workspace-assistant">
      {/* Assistant Header */}
      <div className="assistant-header">
        <div className="assistant-header-info">
          <div className="assistant-avatar">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="currentColor" />
              <path d="M3 17L12 22L21 17V11L12 16L3 11V17Z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h3>AI Legal Assistant</h3>
            <p className="assistant-status">
              {currentStage === 'analyzing' && '🔍 Analyzing your request...'}
              {currentStage === 'template_selected' && '✓ Template selected'}
              {currentStage === 'gathering_info' && '📝 Gathering information'}
              {currentStage === 'generating' && '⚡ Generating document'}
              {currentStage === 'ready' && (document ? 'Helping with your document' : 'Ready to help')}
            </p>
          </div>
        </div>
      </div>

      {/* Template Selection Banner */}
      {selectedTemplate && (
        <div className="selected-template-banner">
          <div className="template-icon">📄</div>
          <div className="template-info">
            <div className="template-name">{selectedTemplate.name}</div>
            <div className="template-status">Template Selected</div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="assistant-messages">
        {/* Welcome Message */}
        {conversationHistory.length === 0 && !document && (
          <div className="assistant-welcome">
            <div className="welcome-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="url(#gradient)" />
                <path d="M3 17L12 22L21 17V11L12 16L3 11V17Z" fill="url(#gradient)" opacity="0.7"/>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#667eea"/>
                    <stop offset="100%" stopColor="#764ba2"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h4>Hi! I'm your AI Legal Assistant</h4>
            <p>I can help you:</p>
            <ul>
              <li>✓ Create legal documents</li>
              <li>✓ Answer legal questions</li>
              <li>✓ Review and improve documents</li>
              <li>✓ Explain complex legal terms</li>
            </ul>
            <p className="welcome-tip">💡 Start by describing what document you need!</p>
          </div>
        )}

        {/* Conversation Messages */}
        {conversationHistory.map((msg, index) => (
          <div key={index} className={`assistant-message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'assistant' ? (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="currentColor" />
                  <path d="M3 17L12 22L21 17V11L12 16L3 11V17Z" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor" />
                </svg>
              )}
            </div>
            <div className="message-content">
              <div 
                className="message-text"
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.message) }} 
              />
              {msg.sources && msg.sources.length > 0 && (
                <div className="message-sources">
                  <div className="sources-label">📚 Sources:</div>
                  {msg.sources.slice(0, 2).map((source, idx) => (
                    <div key={idx} className="source-tag">
                      {source.source} ({source.relevance})
                    </div>
                  ))}
                </div>
              )}
              <span className="message-timestamp">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="assistant-message assistant">
            <div className="message-avatar">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="currentColor" />
                <path d="M3 17L12 22L21 17V11L12 16L3 11V17Z" fill="currentColor" />
              </svg>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="assistant-input-container">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            className="assistant-input"
            placeholder={document ? "Ask me to modify the document or ask questions..." : "Describe what document you need..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isTyping}
            rows={2}
          />
          <button
            className="send-btn"
            onClick={handleSendMessage}
            disabled={!input.trim() || isTyping}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor" />
            </svg>
          </button>
        </div>
        <div className="input-hint">
          💡 Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default WorkspaceAssistant;

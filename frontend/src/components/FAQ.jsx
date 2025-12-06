import React from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";
 
export function Faq() {
  const [open, setOpen] = React.useState(1);
 
  const handleOpen = (value) => setOpen(open === value ? 0 : value);
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Frequently Asked <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Questions</span>
          </h1>
          <p className="text-xl text-gray-600">
            Everything you need to know about LegalAI
          </p>
        </div>

        {/* FAQ Accordions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
            <Accordion open={open === 1}>
              <AccordionHeader 
                className="px-6 py-5 text-lg font-semibold text-gray-800 hover:text-indigo-600 transition-colors border-none" 
                onClick={() => handleOpen(1)}
              >
                What types of legal documents can an AI-powered generator create?
              </AccordionHeader>
              <AccordionBody className="px-6 pb-6 text-gray-700 text-base leading-relaxed">
                Our AI-powered platform can generate a wide variety of legal documents including:
                <ul className="mt-3 ml-6 space-y-2 list-disc">
                  <li>Lease Agreements and Rental Contracts</li>
                  <li>Sale Agreements and Purchase Documents</li>
                  <li>Intellectual Property Licenses</li>
                  <li>Non-Disclosure Agreements (NDAs)</li>
                  <li>Service Contracts and more</li>
                </ul>
                <p className="mt-3">
                  The AI chatbot also helps you navigate through the website according to your requirements and can recommend legal professionals in your city when needed.
                </p>
              </AccordionBody>
            </Accordion>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
            <Accordion open={open === 2}>
              <AccordionHeader 
                className="px-6 py-5 text-lg font-semibold text-gray-800 hover:text-indigo-600 transition-colors border-none" 
                onClick={() => handleOpen(2)}
              >
                Do I need to be a lawyer to use an AI-powered legal document generator?
              </AccordionHeader>
              <AccordionBody className="px-6 pb-6 text-gray-700 text-base leading-relaxed">
                <strong>No legal expertise required!</strong> LegalAI is designed for everyone, regardless of legal background. 
                Our intuitive interface guides you through simple questions, and the AI handles the complex legal language. 
                Whether you're a small business owner, entrepreneur, or individual, you can generate professional legal documents with ease.
              </AccordionBody>
            </Accordion>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
            <Accordion open={open === 3}>
              <AccordionHeader 
                className="px-6 py-5 text-lg font-semibold text-gray-800 hover:text-indigo-600 transition-colors border-none" 
                onClick={() => handleOpen(3)}
              >
                Is it safe to use an AI-powered legal document generator?
              </AccordionHeader>
              <AccordionBody className="px-6 pb-6 text-gray-700 text-base leading-relaxed">
                <strong>Absolutely safe and secure!</strong> We prioritize your data security with:
                <ul className="mt-3 ml-6 space-y-2 list-disc">
                  <li>Enterprise-grade encryption for all data transmission</li>
                  <li>Secure PostgreSQL database with authentication</li>
                  <li>No third-party sharing of your information</li>
                  <li>Regular security audits and updates</li>
                </ul>
                <p className="mt-3">
                  Your documents and personal information are stored securely and remain confidential.
                </p>
              </AccordionBody>
            </Accordion>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
            <Accordion open={open === 4}>
              <AccordionHeader 
                className="px-6 py-5 text-lg font-semibold text-gray-800 hover:text-indigo-600 transition-colors border-none" 
                onClick={() => handleOpen(4)}
              >
                How accurate are the AI-generated legal documents?
              </AccordionHeader>
              <AccordionBody className="px-6 pb-6 text-gray-700 text-base leading-relaxed">
                Our AI is powered by <strong>GPT-4o-mini with legal specialization</strong> and trained on extensive legal databases including Indian law. 
                The platform uses RAG (Retrieval-Augmented Generation) technology to ensure accuracy by referencing verified legal documents. 
                However, we recommend having important documents reviewed by a qualified legal professional before execution.
              </AccordionBody>
            </Accordion>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-3">Still have questions?</h3>
          <p className="mb-6 text-indigo-100">Our AI chat assistant is here to help 24/7</p>
          <button className="bg-white text-indigo-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
            Chat with AI Assistant
          </button>
        </div>
      </div>
    </div>
  );
};
export default Faq;
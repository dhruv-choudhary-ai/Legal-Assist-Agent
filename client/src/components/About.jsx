import React from "react";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block p-3 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full mb-6">
            <img
              src="https://res.cloudinary.com/dvgieawnp/image/upload/v1695017914/eac-pm-calls-for-codification-of-law-of-torts-punitive-damages-to-victims_yjmj3g.jpg"
              alt="Legal document and gavel"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            About <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">LegalAI</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your AI-powered legal document assistant
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 lg:p-16 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              LegalAI - AI-Powered Legal Document Platform
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full mb-6"></div>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">
            <p className="text-lg">
              We provide a powerful web-based solution designed for small businesses and individuals who need professional legal documents without the complexity and high costs of traditional legal services.
            </p>

            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border-l-4 border-teal-500">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How It Works</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-teal-600 mr-2">✓</span>
                  <span><strong>Choose your document type:</strong> Select from our comprehensive library of legal templates</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 mr-2">✓</span>
                  <span><strong>Answer guided questions:</strong> Provide essential details like party names, dates, and specific terms</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 mr-2">✓</span>
                  <span><strong>AI-powered generation:</strong> Our system integrates your inputs with legal databases to create professional documents</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 mr-2">✓</span>
                  <span><strong>Review and download:</strong> Edit if needed and download your document in DOCX format</span>
                </li>
              </ul>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="text-3xl font-bold text-teal-600 mb-2">Fast</div>
                <p className="text-gray-600">Generate documents in minutes, not hours</p>
              </div>
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="text-3xl font-bold text-cyan-600 mb-2">Accurate</div>
                <p className="text-gray-600">AI-powered with legal expertise</p>
              </div>
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600 mb-2">Affordable</div>
                <p className="text-gray-600">Professional documents at a fraction of the cost</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;

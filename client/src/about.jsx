// import React from "react";

// const About = () => {
//   return (
//     <>    
//     <div className="h-screen bg-gradient-to-r from-teal-400 to-cyan-500 flex items-center justify-center ">
//     <div className="bg-white p-6 rounded-lg shadow-md ">
//         <img
//           src="https://res.cloudinary.com/dvgieawnp/image/upload/v1695017914/eac-pm-calls-for-codification-of-law-of-torts-punitive-damages-to-victims_yjmj3g.jpg" // Replace with your photo URL or import it
//           alt="Law Photo"
//           className="w-32 h-32 mx-auto rounded-full"
//         />
//         <h1 className="text-2xl font-semibold text-gray-800 mt-4 justify-center flex">About</h1>
//         <h2 className="text-lg text-gray-600 mt-2 justify-center flex">DocBuddy-Legal document generating AI platform.</h2>
//         <p className="text-gray-700 mt-4">
//         We propose a web-based solution, where the user (i.e.  small businesses or individuals) can prompt their situation or choose the type of legal document they wish to draft. Based on 
//         <br />the choice made, the user will be asked to answer a few required questions such as name of parties involved, date etc. The users will then be guided through a few essential questions, <br />
//         like the names of parties involved. Then, our system seamlessly integrates their inputs into our comprehensive legal databases, streamlining the otherwise complex <br /> and time-consuming document drafting process.

//         </p>
//       </div>
//     </div>
    
//     </>
//   );
// };

// export default About;













//sagar

import React from "react";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 py-12 px-4 mt-10">
      {/* Header Section */}
      <div className="text-center mb-5">
        <h1 className="text-5xl font-bold text-[#804bce] mb-14" style={{ fontFamily: "'DM Serif Display', serif" }}>
          {/* About DocBuddy */}
        </h1>
        {/* <div className="w-24 h-1 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] mx-auto rounded-full"></div> */}
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="md:flex">
            {/* Image Section */}
            <div className="md:w-2/5 relative">
              <img
                src="https://res.cloudinary.com/dvgieawnp/image/upload/v1695017914/eac-pm-calls-for-codification-of-law-of-torts-punitive-damages-to-victims_yjmj3g.jpg"
                alt="Legal Documentation"
                className="w-full h-64 md:h-full object-cover"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              
              {/* Floating Stats */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <div className="flex justify-between text-center">
                    <div>
                      <div className="text-2xl font-bold text-[#804bce]">500+</div>
                      <div className="text-sm text-gray-600">Documents</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#804bce]">95%</div>
                      <div className="text-sm text-gray-600">Accuracy</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#804bce]">24/7</div>
                      <div className="text-sm text-gray-600">Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Content Section */}
            <div className="md:w-3/5 p-8 md:p-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Revolutionizing Legal Document Creation
              </h2>
              
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                DocBuddy is an AI-powered legal document generation platform designed to simplify the complex process of creating legally sound documents for small businesses and individuals.
              </p>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="bg-[#8B5CF6] rounded-full p-2 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">AI-Powered</h3>
                    <p className="text-gray-600 text-sm">Smart document generation</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-[#7C3AED] rounded-full p-2 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Secure & Private</h3>
                    <p className="text-gray-600 text-sm">Your data is protected</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-[#8B5CF6] rounded-full p-2 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Fast & Efficient</h3>
                    <p className="text-gray-600 text-sm">Save time and effort</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-[#7C3AED] rounded-full p-2 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Reliable</h3>
                    <p className="text-gray-600 text-sm">Legally compliant documents</p>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">How It Works</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#804bce] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                    <span className="text-gray-700">Choose your document type or describe your situation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#804bce] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                    <span className="text-gray-700">Answer simple guided questions about your needs</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#804bce] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                    <span className="text-gray-700">Our AI seamlessly generates your customized document</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#804bce] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                    <span className="text-gray-700">Download, edit, and use your professional legal document</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
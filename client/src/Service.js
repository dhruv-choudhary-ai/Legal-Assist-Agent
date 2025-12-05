// import React, { useState, useEffect, useContext } from "react";
// import { useParams, Link } from "react-router-dom";
// import "./Service.css";
// import Navbar from "./Navbar";
// import Progress from "react-progressbar";
// import ProgressBar from "@ramonak/react-progress-bar";
// import { StepContext } from "./context/StepContext";

// function Service() {
//   const initialCards = [
//     { title: "Lease Deed", category: "Contracts" },
//     { title: "Rent Agreement", category: "Important" },
//     { title: "Allowance", category: "Important" },
//     { title: "Allowance", category: "Important" },
//     { title: "Maintainance", category: "Contracts" },
//     { title: "Acceptance", category: "New" },
//     // Add more card data here
//   ];

//   const { id } = useParams();
//   const [data, setData] = useState([]);
//   const [serviceName, setServiceName] = useState("");

//   const context = useContext(StepContext);

//   const [selectedCategory, setSelectedCategory] = useState("");
//   const categories = Array.from(
//     new Set(initialCards.map((card) => card.category))
//   );

//   const filteredCards = selectedCategory
//     ? initialCards.filter((card) => card.category === selectedCategory)
//     : initialCards;

//   const handleFilter = (selectedCategory) => {
//     setSelectedCategory(selectedCategory);
//   };

//   useEffect(() => {
//     window.scrollTo(0, 0);

//     context.setStep1(false);
//     context.setStep2(false);
//     context.setStep3(false);
//     context.setStep4(false);

//     fetch(`http://127.0.0.1:5000/api/forms?service_id=${id}`, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     })
//       .then((res) => {
//         if (!res.ok) {
//           throw Error("could not fetch");
//         }
//         return res.json();
//       })
//       .then((res) => {
//         console.log(res);
//         setData(res);
//         // console.log(data);
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }, []);

//   useEffect(() => {
//     if (data.length > 0) {
//       setServiceName(data[0].service_name);
//     }
//   }, [data]);

//   const handleClick= () => {
//     context.setStep1(true);
//   }

//   return (
//     <div className="outer">
//       <div className="absolute inset-0 overflow-hidden h-full">
//         <video
//           autoPlay
//           loop
//           muted
//           className="h-screen w-screen object-cover object-center fixed top-0 left-0 z-0"
//           style={{ zIndex: -1 }}
//         >
//           <source
//             src="https://res.cloudinary.com/dyxnmjtrg/video/upload/v1694668584/Purple_Blue_Modern_Tech_Business_Conference_Video_d5vf0l.mp4"
//             type="video/mp4"
//           />
//           {/* You can add additional source elements for different video formats (e.g., WebM, Ogg) if needed */}
//           Your browser does not support the video tag.
//         </video>
//       </div>

//       <div className="serve w-full">
//         {/* <div className="right">

//           <h2>Steps: </h2>
//           <br />
//          <ol >

//           <li className="bg-blue-500 rounded">Select legal document. </li>
//           <br />
//           <li className="bg-white rounded">Enter the details in form pertaining to your problem. </li>
//           <li>Edit the document as per your requirement.</li>
//           <li>Download legal document. </li>
//          </ol>


//         </div> */}

//         <div className="cards mx-auto">
//           <div className="cards mx-auto">
//             {/* <div style={{ display: 'flex', alignItems: 'center', marginTop: '50px' }}>
//   <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'blue', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '1px' }}>
//     1
//   </div>
//   <div style={{ width: '900px' }}>
//     <Progress completed={50} />
//   </div>
// </div> */}

//             <div
//               className="my-7 flex justify-center"
//             >
//               <ul className="steps">
//                 <li
//                   className={`step ${context.step1 ? "step-success" : ""} text-white font-semibold`}
//                 >
//                   Select Legal Document
//                 </li>
//                 <li
//                   className={`step  ${context.step2 ? "step-success" : ""} text-white font-semibold`}
//                   style={{ color: "white" }}
//                 >
//                   Fill information
//                 </li>
//                 <li
//                   className={`step  ${context.step3 ? "step-success" : ""} text-white font-semibold`}
//                   style={{ color: "white" }}
//                 >
//                   Edit document
//                 </li>
//                 <li
//                   className={`step ${context.step4 ? "step-success" : ""} text-white font-semibold`}
//                   style={{ color: "white" }}
//                 >
//                   Download document
//                 </li>
//               </ul>
//             </div>
//           </div>

//           <div className="flex flex-col justify-center items-center ">
//             <h1 className="text-4xl font-bold text-center  text-white mb-7 mt-3 ">
//               {serviceName.length > 0 && serviceName}
//             </h1>
//             {data.length > 0 ? (
//               data.map((form, index) => (
//                 <Link
//                   to={"/form/" + form.form_id}
//                   className="card"
//                   key={form.form_id}
//                   onClick={handleClick}
//                 >
//                   <div className="flex w-full mx-auto text-center">
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                       stroke-width="1.5"
//                       stroke="currentColor"
//                       className="w-9 h-9"
//                     >
//                       <path
//                         stroke-linecap="round"
//                         stroke-linejoin="round"
//                         d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
//                       />
//                     </svg>
//                     <p className="text-xl font-semibold mt-1 px-3">
//                       {form.form_name}
//                     </p>
//                   </div>

//                   <button>View Document</button>
//                 </Link>
//               ))
//             ) : (
//               <div className="flex justify-center w-full items-center">
//                 <p className="text-4xl text-white font-bold">
//                   Contact the Lawyer...
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Service;











// sagar

import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import "./Service.css";
import { StepContext } from "./context/StepContext";
import { Typography } from "@material-tailwind/react";

function Service() {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [serviceName, setServiceName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const context = useContext(StepContext);

  useEffect(() => {
    window.scrollTo(0, 0);

    context.setStep1(false);
    context.setStep2(false);
    context.setStep3(false);
    context.setStep4(false);
    
    setIsLoading(true);
    
    fetch(`http://127.0.0.1:5000/api/forms?service_id=${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw Error("could not fetch");
        }
        return res.json();
      })
      .then((res) => {
        console.log("Forms data:", res);
        setData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setIsLoading(false);
      });
  }, [id]);

  // Get service name from data or fetch separately if needed
  useEffect(() => {
    if (data.length > 0) {
      setServiceName(data[0].service_name);
    } else {
      // If no forms, we still need to show service name
      // You might want to fetch service details separately
      fetch(`http://127.0.0.1:5000/api/services`)
        .then(res => res.json())
        .then(services => {
          const service = services.find(s => s.service_id == id);
          if (service) {
            setServiceName(service.service_name);
          }
        })
        .catch(err => console.log(err));
    }
  }, [data, id]);

  const handleClick = () => {
    context.setStep1(true);
  };

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 overflow-hidden h-full bg-[#FCFAFF]">
        <video
          autoPlay
          loop
          muted
          className="h-screen w-screen object-cover object-center fixed top-0 left-0 z-0"
          style={{ zIndex: -1 }}
        >
          <source
            // src="https://res.cloudinary.com/dyxnmjtrg/video/upload/v1694668584/Purple_Blue_Modern_Tech_Business_Conference_Video_d5vf0l.mp4"
            // type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="py-12 relative z-10">
        <Typography
          variant="h2"
          color="white"
          className="font-bold text-4xl font-serif text-center text-[#804bce] mb-7 mt-3"
          style={{
            fontFamily: '"DM Serif Display", "Open Sans", "PT Sans", sans-serif',
            marginTop: "90px",
          }}
        >
          {serviceName.length > 0 ? serviceName : "Available Documents"}
        </Typography>

        {/* Progress Steps */}
        <div className="my-7 flex justify-center">
          <ul className="steps">
            <li
              className={`step ${context.step1 ? "step-success" : ""} text-[#804bce] font-semibold`}
            >
              Select Legal Document
            </li>
            <li
              className={`step ${context.step2 ? "step-success" : ""} text-[#804bce] font-semibold`}
            >
              Fill information
            </li>
            <li
              className={`step ${context.step3 ? "step-success" : ""} text-[#804bce] font-semibold`}
            >
              Edit document
            </li>
            <li
              className={`step ${context.step4 ? "step-success" : ""} text-[#804bce] font-semibold`}
            >
              Download document
            </li>
          </ul>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center w-full items-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#804bce]"></div>
          </div>
        ) : (
          /* Documents Grid or Empty State */
          <section className="text-black w-full">
            <div className="container lg:px-16 md:px-9 px-5 py-6 mx-auto w-full">
              {data && data.length > 0 ? (
                <div className="flex flex-wrap -m-4 w-full justify-center">
                  {data.map((form) => (
                    <Link
                      to={"/form/" + form.form_id}
                      className="p-4 md:w-1/3 cursor-pointer group"
                      key={form.form_id}
                      onClick={handleClick}
                    >
                      <div className="
                        h-full border-2 border-gray-200 border-opacity-60 rounded-2xl overflow-hidden 
                        bg-white relative
                        transform transition-all duration-300 ease-out
                        group-hover:scale-105 group-hover:shadow-2xl group-hover:-translate-y-2
                      ">
                        {/* Top-left triangle - enters on hover */}
                        <div className="
                          absolute top-0 left-0 w-0 h-0
                          border-t-[80px] border-t-[#8B5CF6] border-r-[80px] border-r-transparent
                          opacity-0 group-hover:opacity-90
                          transition-all duration-700 ease-out
                          group-hover:translate-x-0 group-hover:translate-y-0
                          -translate-x-full -translate-y-full
                          z-20
                          rounded-tl-2xl
                        "></div>

                        {/* Bottom-right triangle - visible by default, disappears on hover */}
                        <div className="
                          absolute bottom-0 right-0 w-0 h-0
                          border-b-[60px] border-b-[#7C3AED] border-l-[60px] border-l-transparent
                          opacity-70 group-hover:opacity-0
                          transition-all duration-500 ease-in-out
                          group-hover:translate-x-4 group-hover:translate-y-4
                          z-20
                          rounded-br-2xl
                        "></div>

                        {/* Inner glow effect */}
                        <div className="
                          absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                          transition-opacity duration-500 pointer-events-none
                          bg-gradient-to-br from-purple-50/40 via-transparent to-purple-50/20
                          z-10
                        "></div>

                        <div className="p-6 h-full flex flex-col items-center justify-center relative z-30">
                          <div className="flex items-center justify-center mb-4">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className="w-12 h-12 text-blue-600 transform transition-transform duration-300 group-hover:scale-110 group-hover:text-purple-600"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                              />
                            </svg>
                          </div>
                          
                          <h2 className="text-xl font-bold text-black mb-3 text-center transform transition-transform duration-300 group-hover:scale-105">
                            {form.form_name}
                          </h2>
                          
                          <button className="mt-4 px-6 py-2 bg-[#804bce] text-white rounded-xl hover:bg-[#804bce] transition-all duration-300 font-semibold transform group-hover:scale-110 group-hover:shadow-lg">
                            View Document
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                /* Empty State - This should show for services 4,5,6,7 */
                <div className="flex flex-col justify-center w-full items-center py-12">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-24 h-24 text-gray-400 mb-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                  <p className="text-3xl text-white font-bold mb-4">
                    No Documents Available
                  </p>
                  <p className="text-xl text-gray-300 mb-8">
                    Contact the Lawyer for {serviceName}
                  </p>
                  <button className="px-8 py-3 bg-[#804bce] text-white rounded-xl hover:bg-[#6d3db0] transition-all duration-300 font-semibold text-lg">
                    Contact Now
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default Service;
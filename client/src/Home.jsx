
// import React, { useContext } from "react";
// import { useState } from "react";
// import Footer from "./footer";
// import Chatbot from "./chatbot";
// import { Link } from "react-router-dom";
// import Navbar from "./Navbar";
// import { StepContext } from "./context/StepContext";

// import {
//   MobileNav,
//   Typography,
//   Button,
//   IconButton,
//   Card,
// } from "@material-tailwind/react";

// function Home() {
//   const context = useContext(StepContext);
//   const [openNav, setOpenNav] = React.useState(false);
//   const [data, setData] = useState([]);

//   React.useEffect(() => {
//     window.addEventListener(
//       "resize",
//       () => window.innerWidth >= 960 && setOpenNav(false)
//     );
//     window.scrollTo(0, 0);

//     context.setStep1(false);
//     context.setStep2(false);
//     context.setStep3(false);
//     context.setStep4(false);

//     fetch("http://127.0.0.1:5000/api/services")
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

//     // console.log(data);
//   }, []);

//   const navList = (
//     <ul className="mb-4 mt-2 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6 ">
//       <Typography
//         as="li"
//         variant="small"
//         color="blue-gray"
//         className="p-1 font-normal"
//       >
//         <a href="#" className="flex items-center">
//           About
//         </a>
//       </Typography>
//       <Typography
//         as="li"
//         variant="small"
//         color="blue-gray"
//         className="p-1 font-normal"
//       >
//         <a href="#" className="flex items-center">
//           Services
//         </a>
//       </Typography>
//       <Typography
//         as="li"
//         variant="small"
//         color="blue-gray"
//         className="p-1 font-normal"
//       >
//         <a href="#" className="flex items-center">
//           Docs
//         </a>
//       </Typography>
//       {/* <Typography
//         as="li"
//         variant="small"
//         color="blue-gray"
//         className="p-1 font-normal"
//       >
//         <a href="#" className="flex items-center">
          
//         </a>
//       </Typography> */}
//     </ul>
//   );

//   return (
//     <div className="min-h-screen ">
      
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

//       <div className="py-12 relative z-10">
//         {/* <Card className="mb-12 overflow-hidden">
//           <img
//             alt="nature"
//             className="h-[32rem] w-full object-cover object-center"
//             src="https://images.unsplash.com/photo-1485470733090-0aae1788d5af?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2717&q=80"
//           />
//         </Card> */}
//         <Typography
//           variant="h2"
//           color="white"
//           className="font-bold text-4xl font-serif text-center text-white mb-2 "
//           style={{
//             fontFamily:
//               ' "DM Serif Display", "Open Sans", "PT Sans", sans-serif',
//             marginTop: "90px",
//           }}
//         >
//           Tired of making legal documents?
//         </Typography>
//         <Typography
//           color="white"
//           className="font-normal text-center"
//           style={{ fontFamily: '  "PT Sans", sans-serif' }}
//         >
//           This is your one stop destination to get all your queries resolved!
//         </Typography>

//         <div className="md:max-w-3xl mx-auto mt-14 -mb-7 px-3">
//           <Typography
//             color="white"
//             className="font-light text-center md:text-xl text-base"
//             style={{ fontFamily: '  "PT Sans", sans-serif' }}
//           >
//             Now seamlessly draft your legal documents without knowing any legal jargons. Just answer some easy questions and 
//             get your documents drafted with custom editable feature. 
//             <br />
//             Not sure which document to choose? Ask our AI powered Chatbot!!
//           </Typography>
//         </div>

//         {data.length > 0 && (
//           <Typography
//             variant="h2"
//             color="white"
//             className="font-bold text-4xl font-serif text-center text-white -mb-14 "
//             style={{
//               fontFamily:
//                 ' "DM Serif Display", "Open Sans", "PT Sans", sans-serif',
//               marginTop: "90px",
//             }}
//           >
//             Available Documents
//           </Typography>
//         )}
//         {data.length > 0 ? (
//           <section className="text-black w-full">
//             <div className="container lg:px-16 md:px-9 px-5 py-24 mx-auto w-full">
//               <div className="flex flex-wrap -m-4 w-full">
//                 {data.map((service, index) => (
//                   <Link
//                     to={`/service/${service.service_id}`}
//                     className="p-4 md:w-1/3 cursor-pointer transform transition ease-in-out hover:scale-90 duration-500"
//                     key={service.service_id}
//                   >
//                     <div className="h-full border-2 border-gray-200 border-opacity-60 rounded-lg overflow-hidden">
//                       <img
//                         className="lg:h-48 md:h-36 w-full object-cover object-center"
//                         src={service.img_link}
//                         alt="blog"
//                       />
//                       <div className="bg-[#E6E6FA] h-full">
//                         <div className="p-6">
//                           <h2 className=" text-lg font-bold text-black mb-3 text-center">
//                             {service.service_name}
//                           </h2>
//                           <div className="flex justify-center mb-3 ">
//                             <p className="text-lg font-normal text-black text-justify">
//                               {service.description}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </Link>
//                 ))}
//               </div>
//             </div>
//           </section>
//         ) : (
//           <div className="flex justify-center items-center h-full w-full">
//             <p className="text-4xl text-white font-semibold">Loading...</p>
//           </div>
//         )}
//         {/* <div className="flex flex-wrap justify-between">
//           <a
//             href="#"
//             className=" md:w-1/4 bg-white border border-gray-200 rounded-lg shadow mb-4 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
//           >
//             <img
//               className="object-cover w-full h-96 md:h-auto md:w-48 rounded-t-lg md:rounded-l-lg"
//               src="https://res.cloudinary.com/dyxnmjtrg/image/upload/v1694691119/property_wb2bha.jpg"
//               alt=""
//             />
//             <div className="flex flex-col justify-between p-4 leading-normal">
//               <h5 className=" mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white text-center">
//                 Property <br /> Documents
//               </h5>
//             </div>
//           </a>
//           <a
//             href="#"
//             className="flex flex-col items-center w-full md:w-1/4 bg-white border border-gray-200 rounded-lg shadow mb-4 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
//           >
//             <img
//               className="object-cover w-full h-96 md:h-auto md:w-48 rounded-t-lg md:rounded-l-lg"
//               src="https://res.cloudinary.com/dyxnmjtrg/image/upload/v1694753446/business_frtlpg.jpg"
//               alt=""
//             />
//             <div className="flex flex-col justify-between p-4 leading-normal">
//               <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white text-center">
//                 Business
//                 <br /> Documents
//               </h5>
//             </div>
//           </a>
//           <a
//             href="#"
//             className="flex flex-col items-center w-full md:md:w-1/4 bg-white border border-gray-200 rounded-lg shadow mb-4 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
//           >
//             <img
//               className="object-cover w-full h-96 md:h-auto md:md:w-48 rounded-t-lg md:rounded-l-lg"
//               src="https://res.cloudinary.com/dyxnmjtrg/image/upload/v1694753486/law_f6g4co.jpg"
//               alt=""
//             />
//             <div className="flex flex-col justify-between p-4 leading-normal">
//               <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white text-center">
//                 Divorce <br /> Documents
//               </h5>
//             </div>
//           </a>
//         </div> */}
//         <div className="chat-bot">
//           {/* div for chatbot */}

//           {/* <Chatbot/> */}
//         </div>
//       </div>
//     </div>
//   );
// }
// export default Home;






// sagar 
import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./footer";
import Chatbot from "./chatbot";
import { StepContext } from "./context/StepContext";

/**
 * Home component with upgraded gradient-hover card UI and improved triangle animation.
 */
function Home() {
  const context = useContext(StepContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (context?.setStep1) context.setStep1(false);
    if (context?.setStep2) context.setStep2(false);
    if (context?.setStep3) context.setStep3(false);
    if (context?.setStep4) context.setStep4(false);

    setLoading(true);
    fetch("http://127.0.0.1:5000/api/services")
      .then((res) => {
        if (!res.ok) throw new Error("Could not fetch services");
        return res.json();
      })
      .then((res) => setData(Array.isArray(res) ? res : []))
      .catch((err) => {
        console.error(err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [context]);

  return (
    <div className="min-h-screen bg-[#FCFAFF] text-[#1F2937]">
      <Navbar />

      {/* HERO */}
      <header className="pt-16 pb-8 md:pt-20 md:pb-14">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1
            className="mt-10 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Tired of making legal documents?
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#374151]">
            This is your one stop destination to get all your queries resolved!
          </p>
          <p className="mt-6 text-sm sm:text-base md:text-lg text-[#4B5563] max-w-3xl mx-auto leading-relaxed">
            Now seamlessly draft your legal documents without knowing any legal
            jargons. Just answer some easy questions and get your documents
            drafted with custom editable feature. <br />
            Not sure which document to choose? Ask our AI powered chatbot!
          </p>
        </div>
      </header>

      {/* AVAILABLE DOCUMENTS */}
      <section className="mt-1">
        <div className="max-w-6xl mx-auto px-6">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Available Documents
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-xl text-[#374151] font-medium">Loading...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-xl text-[#374151] font-medium">
                No documents available.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((service) => (
                <Link
                  key={service.service_id}
                  to={`/service/${service.service_id}`}
                  className="block p-2"
                >
                  <div
                    className="
                    h-full bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100
                    relative group
                    transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-2
                    "
                  >
                    {/* Top-left purple triangle - BIG, enters from top-left on hover */}
                    <div
                      className="
                      absolute top-0 left-0 w-0 h-0
                      border-t-[100px] border-t-[#8B5CF6] border-r-[100px] border-r-transparent
                      opacity-0 group-hover:opacity-90
                      transition-all duration-700 ease-out
                      group-hover:translate-x-0 group-hover:translate-y-0
                      -translate-x-full -translate-y-full
                      z-20
                      "
                    ></div>

                    {/* Bottom-right purple triangle - SMALL, visible by default, disappears on hover */}
                    <div
                      className="
                      absolute bottom-0 right-0 w-0 h-0
                      border-b-[60px] border-b-[#7C3AED] border-l-[60px] border-l-transparent
                      opacity-70 group-hover:opacity-0
                      transition-all duration-500 ease-in-out
                      group-hover:translate-x-4 group-hover:translate-y-4
                      z-20
                      "
                    ></div>

                    {/* Additional inner glow effect */}
                    <div
                      className="
                      absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                      transition-opacity duration-500 pointer-events-none
                      bg-gradient-to-br from-purple-50/30 via-transparent to-purple-50/20
                      z-10
                      "
                    ></div>

                    {/* image */}
                    <div className="w-full h-48 flex items-center justify-center bg-gray-50 overflow-hidden relative z-10">
                      <img
                        src={service.img_link}
                        alt={service.service_name}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    </div>

                    {/* content */}
                    <div className="p-6 bg-white relative z-10">
                      <h3 className="text-lg font-semibold text-[#111827] text-center">
                        {service.service_name}
                      </h3>
                      <p className="mt-3 text-sm text-[#4B5563] leading-relaxed text-justify max-h-28 overflow-hidden">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Chatbot */}
      <div className="max-w-6xl mx-auto px-6 mt-12 flex justify-end">
        {/* <Chatbot /> */}
      </div>
    </div>
  );
}

export default Home;
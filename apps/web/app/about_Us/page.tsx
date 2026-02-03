'use client';

import React from 'react';
// import { Swiper, SwiperSlide } from 'swiper/react';
// import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const AboutUsPage = () => {
    const teamMembers = [
        {
           name: "Aryan Murkute",
            role: "UI/UX Designer",
            image: "/api/placeholder/150/150", 
            bio: "Crafting intuitive and engaging user experiences through thoughtful design", 
        },
        {
            name: "Vivek Parihar",
            role: "Android Developer",
            image: "/api/placeholder/150/150",
            bio: "Specializing in creating seamless mobile experiences on Android platforms",
        },
        {
            name: "Satvik Kale",
            role: "Full Stack Web Developer",
            image: "/https://media.licdn.com/media/AAYQAQSOAAgAAQAAAAAAAB-zrMZEDXI2T62PSuT6kpB6qg.png",
            bio: "Passionate about building responsive and user-friendly web applications",
        },
        {
            name: "Umesh Aagle",
            role: "Digital Marketing Specialist",
            image: "/api/placeholder/150/150",
            bio: "Driving growth through innovative marketing strategies",
        },
        {
            name: "Lavanya",
            role: "Content Writer",
            image: "/api/placeholder/150/150",
            bio: "Crafting compelling narratives and engaging content",
            skills: ["Copywriting", "SEO", "Storytelling"]
        }
    ];

    const guide = {
        name: "Mrs. Raksha Kardak",
        role: "Project Guide & Mentor",
        image: "/api/placeholder/200/200",
        bio: "With over 15 years of experience in software development and team leadership, Mrs. Raksha Kardak guides our team towards excellence.",
    };

    return (
        <div className="min-h-screen bg-white text-gray-800 overflow-hidden">

            {/* Guide Section */}
            {/* <div className="py-10 sm:py-16 lg:py-20 px-4 sm:px-6">
                <div className="container mx-auto">
                    <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            OUR GUIDE
                        </h2>
                        <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto"></div>
                    </div>
                    
                    <div className="max-w-4xl mx-auto">
                        <div className="relative bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-gray-200 shadow-lg">
                            <div className="flex flex-col items-center gap-6 sm:gap-8 lg:flex-row">
                                <div className="relative flex-shrink-0">
                                    <img 
                                        src={guide.image} 
                                        alt={guide.name}
                                        className="w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-xl sm:rounded-2xl border-4 border-blue-200 shadow-md"
                                    />
                                </div>
                                <div className="flex-1 text-center lg:text-left">
                                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-gray-800">{guide.name}</h3>
                                    <p className="text-blue-600 font-semibold mb-3 sm:mb-4 text-base sm:text-lg">{guide.role}</p>
                                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base lg:text-lg">{guide.bio}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> */}

            {/* Team Members Section */}
            {/* <div className="py-10 sm:py-16 lg:py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-gray-50">
                <div className="container mx-auto">
                    <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            MEET THE TEAM
                        </h2>
                        <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-4 sm:mb-6"></div>
                        <p className="text-gray-600 text-base sm:text-lg lg:text-xl px-4">Elite professionals driving innovation forward</p>
                    </div>

                    <Swiper
                        modules={[Navigation, Pagination, Autoplay]}
                        spaceBetween={20}
                        slidesPerView={1}
                        navigation={{
                            enabled: true,
                        }}
                        pagination={{ 
                            clickable: true,
                            dynamicBullets: true 
                        }}
                        autoplay={{ delay: 3000 }}
                        breakpoints={{
                            480: {
                                slidesPerView: 1,
                                spaceBetween: 20,
                            },
                            640: {
                                slidesPerView: 1,
                                spaceBetween: 25,
                            },
                            768: {
                                slidesPerView: 2,
                                spaceBetween: 25,
                            },
                            1024: {
                                slidesPerView: 3,
                                spaceBetween: 30,
                            },
                        }}
                        className="team-swiper !pb-12"
                    >
                        {teamMembers.map((member, index) => (
                            <SwiperSlide key={index}>
                                <div className="group relative bg-gradient-to-b from-white to-blue-50 rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-300 transition-all duration-500 hover:scale-105 h-full shadow-lg hover:shadow-xl">
                                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    
                                    <div className="relative p-4 sm:p-6 lg:p-8 text-center">
                                        <div className="relative mb-4 sm:mb-6">
                                            <img 
                                                src={member.image} 
                                                alt={member.name}
                                                className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-xl sm:rounded-2xl mx-auto border-2 border-gray-300 group-hover:border-blue-400 transition-colors duration-300 shadow-md"
                                            />
                                        </div>
                                        
                                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 text-gray-800">{member.name}</h3>
                                        <p className="text-blue-600 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{member.role}</p>
                                        <p className="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed px-2">{member.bio}</p>
                                    </div>

                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div> */}

            {/* Mission Section */}
            <div className="py-10 sm:py-16 lg:py-20 px-4 sm:px-6">
                <div className="container mx-auto">
                    <div className="relative max-w-5xl mx-auto">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-purple-100/50 rounded-2xl sm:rounded-3xl blur-xl"></div>
                        <div className="relative bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-blue-200 shadow-lg">
                            <div className="text-center">
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    OUR MISSION
                                </h2>
                                <p className="text-sm sm:text-base lg:text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto px-4">
                                    We transform complex challenges into elegant solutions through innovation, collaboration, 
                                    and relentless pursuit of excellence. Our mission is to empower businesses and create 
                                    extraordinary user experiences that shape the digital future.
                                </p>
                                <div className="mt-6 sm:mt-8 flex justify-center">
                                    <div className="w-20 sm:w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUsPage;
import React, { useContext } from "react";
import { useTheme } from "./ThemeContext"; 

function AboutUs() {
    const { darkMode } = useTheme();

    return (
        <div>
            <section
                className={`relative py-10 flex items-center justify-center min-h-screen mt-[-60px] sm:mt-[-100px]`}
                style={{ backgroundImage: "url('../src/img/about-us-image.png')", backgroundSize: "100% 100%"}}
            >
                {/* Content */}
                <div className={`relative z-10 w-100 sm:max-w-4xl mx-auto p-6 sm:p-10 rounded-2xl shadow-lg border border-white/20 
                    ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-700"} bg-opacity-90 transition duration-300`}>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-red-500 text-center mb-6">ABOUT US</h2>
                    <p className="text-lg sm:text-xl leading-relaxed text-center">
                        At <span className="font-bold text-red-400">SAVE.PH</span>, we are committed to building a safer, more resilient
                        Philippines by providing disaster monitoring, risk assessment, and
                        emergency response coordination.
                        <br /><br />
                        Our platform empowers communities, responders, and decision-makers
                        with the tools and information needed to prepare for, respond to,
                        and recover from natural and man-made disasters.
                        <br /><br />
                        With a focus on technology, collaboration, and proactive risk
                        management, SAVE.PH serves as a hub for critical updates, crisis
                        mapping, and relief efforts.
                        <br /><br />
                        Our mission is to ensure that every Filipino has access to timely
                        and reliable information that can help save lives and protect
                        livelihoods.
                        <br /><br />
                        Together, we can create a future where communities are informed,
                        prepared, and ready to face any challenge.
                    </p>
                </div>
            </section>
        </div>
    );
}

export default AboutUs;

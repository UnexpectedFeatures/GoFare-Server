import React from "react";

function AboutUs() {
  return (
    <div className="text-white min-h-screen ">
      <section
        className="relative py-6 flex items-center justify-center"
        style={{ backgroundImage: "url('../src/img/about-us-image.png')", backgroundSize: "100%, 100%"}}
      >

        {/* Content Container */}
        <div className="relative z-10 max-w-3xl mx-auto inset-0 bg-black bg-opacity-60 backdrop-blur-lg p-10 rounded-2xl shadow-lg border border-white/20">
          <h2 className="text-5xl font-extrabold text-red-500 text-center mb-6">
            ABOUT US
          </h2>
          <p className="text-lg leading-relaxed text-gray-200 text-center">
            At <span className="font-bold text-red-400">SAVE.PH</span>, we are committed to building a safer, more resilient
            Philippines by providing disaster monitoring, risk assessment, and
            emergency response coordination.
            <br />
            <br />
            Our platform empowers communities, responders, and decision-makers
            with the tools and information needed to prepare for, respond to,
            and recover from natural and man-made disasters.
            <br />
            <br />
            With a focus on technology, collaboration, and proactive risk
            management, SAVE.PH serves as a hub for critical updates, crisis
            mapping, and relief efforts.
            <br />
            <br />
            Our mission is to ensure that every Filipino has access to timely
            and reliable information that can help save lives and protect
            livelihoods.
            <br />
            <br />
            Together, we can create a future where communities are informed,
            prepared, and ready to face any challenge.
          </p>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;

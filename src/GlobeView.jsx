import React, { useRef, useEffect } from 'react';
import Globe from 'react-globe.gl';  // Import react-globe

export default function GlobeView() {
    const globeRef = useRef();

    useEffect(() => {
        if (globeRef.current) {
            // You can further customize globe settings here
            globeRef.current.pointOfView({ lat: 12.8797, lng: 121.7740, altitude: 2 }, 0); // Philippines coordinates
        }
    }, []);

    return (
        <div className="h-screen w-full">
            <Globe
                ref={globeRef}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                backgroundColor="rgba(0,0,0,0)"
                showAtmosphere={true}
                atmosphereColor="rgba(255, 255, 255, 0.5)"
                enablePointerInteraction={true}
                // You can add more customization here as needed
            />
        </div>
    );
}

import React, { useState, useEffect, useRef } from 'react';
import { useLoadScript } from '@react-google-maps/api';

const libraries = ['places'];

function LocationInput({ onLocationSelect }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
    libraries,
  });

  const inputRef = useRef(null);

  useEffect(() => {
    if (isLoaded && inputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current);
      autocomplete.setFields(['address_components', 'geometry']);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          onLocationSelect({
            address: place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
        }
      });
    }
  }, [isLoaded, onLocationSelect]);

  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Enter event location"
      className="w-full p-2 border rounded mt-1"
    />
  );
}

export default LocationInput;

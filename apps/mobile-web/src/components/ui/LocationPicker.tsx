import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

export interface ExtractedAddress {
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: ExtractedAddress) => void;
}

const containerStyle = {
  width: "100%",
  height: "100%",
};

// Top-level configuration object prevents needless re-renders
const LIBRARIES: "places"[] = ["places"];

const defaultCenter = {
  lat: 28.6139, // Default to New Delhi if geolocation fails
  lng: 77.209,
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] =
    useState<google.maps.LatLngLiteral>(defaultCenter);
  const [selectedAddress, setSelectedAddress] =
    useState<ExtractedAddress | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Try to grab user's current location on open
  useEffect(() => {
    if (isOpen && "geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMarkerPosition(currentLoc);
          if (map) map.panTo(currentLoc);
          geocodePosition(currentLoc);
          setIsLocating(false);
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true },
      );
    }
  }, [isOpen, map]);

  const onLoadMap = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onUnmountMap = useCallback(() => {
    setMap(null);
  }, []);

  const geocodePosition = (pos: google.maps.LatLngLiteral) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: pos }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        parseAddressResult(results[0], pos);
      }
    });
  };

  const parseAddressResult = (
    place: google.maps.GeocoderResult | google.maps.places.PlaceResult,
    pos: google.maps.LatLngLiteral,
  ) => {
    let streetNumber = "";
    let route = "";
    let city = "";
    let state = "";
    let pincode = "";

    place.address_components?.forEach((component) => {
      const types = component.types;
      if (types.includes("street_number")) streetNumber = component.long_name;
      if (types.includes("route")) route = component.long_name;
      if (types.includes("locality")) city = component.long_name;
      if (types.includes("administrative_area_level_1"))
        state = component.long_name;
      if (types.includes("postal_code")) pincode = component.long_name;
    });

    const addressLine1 =
      [streetNumber, route].filter(Boolean).join(" ").trim() ||
      place.formatted_address ||
      "Unknown Location";

    setSelectedAddress({
      addressLine1,
      city,
      state,
      pincode,
      lat: pos.lat,
      lng: pos.lng,
    });
  };

  const onMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMarkerPosition(pos);
    geocodePosition(pos);
  };

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMarkerPosition(pos);
    geocodePosition(pos);
  };

  const onLoadAutocomplete = (
    autocomplete: google.maps.places.Autocomplete,
  ) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const pos = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setMarkerPosition(pos);
        if (map) map.panTo(pos);
        parseAddressResult(place, pos);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedAddress) {
      onSelect(selectedAddress);
      onClose();
    }
  };

  if (loadError)
    return (
      <div className="p-4 text-danger">Error loading maps. Check API keys.</div>
    );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-[24px] bg-surface text-left align-middle shadow-xl transition-all border border-border-subtle flex flex-col h-[85vh]">
                <div className="p-4 border-b border-border-subtle flex items-center justify-between shrink-0">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-black text-text-primary px-2"
                  >
                    Pin Location
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-surface-subtle transition-colors"
                  >
                    <span className="material-symbols-outlined text-text-secondary">
                      close
                    </span>
                  </button>
                </div>

                <div className="flex-1 relative">
                  {!isLoaded ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-subtle">
                      <div className="animate-spin size-8 rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : (
                    <>
                      <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
                        <Autocomplete
                          onLoad={onLoadAutocomplete}
                          onPlaceChanged={onPlaceChanged}
                          className="flex-1"
                        >
                          <div className="relative w-full">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary">
                              search
                            </span>
                            <input
                              type="text"
                              placeholder="Search building, area, or street..."
                              className="w-full h-12 pl-11 pr-4 rounded-xl border-none shadow-[0_4px_12px_rgba(0,0,0,0.1)] bg-white text-text-primary outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                            />
                          </div>
                        </Autocomplete>
                      </div>

                      <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={markerPosition}
                        zoom={15}
                        onClick={onMapClick}
                        onLoad={onLoadMap}
                        onUnmount={onUnmountMap}
                        options={{
                          disableDefaultUI: true,
                          zoomControl: true,
                        }}
                      >
                        <Marker
                          position={markerPosition}
                          draggable
                          onDragEnd={onMarkerDragEnd}
                          animation={window.google?.maps?.Animation?.DROP}
                        />
                      </GoogleMap>
                    </>
                  )}
                </div>

                <div className="p-5 border-t border-border-subtle bg-surface shrink-0">
                  <div className="mb-4">
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                      Selected Draft
                    </p>
                    <p className="text-sm text-text-primary font-medium line-clamp-2">
                      {isLocating
                        ? "Locating you..."
                        : selectedAddress?.addressLine1
                          ? `${selectedAddress.addressLine1}, ${selectedAddress.city}`
                          : "Drag the pin or tap the map to select a point"}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-3 text-sm font-bold text-text-secondary bg-surface-subtle border border-border-subtle rounded-xl hover:bg-border-subtle transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={!selectedAddress}
                      className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-primary to-primary-hover rounded-xl shadow-[0_4px_12px_rgba(255,122,0,0.25)] hover:shadow-[0_6px_16px_rgba(255,122,0,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Confirm Location
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

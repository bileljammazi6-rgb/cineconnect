import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Users, Share2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

// Mapbox configuration
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

interface UserLocation {
  id: string;
  username: string;
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  updated_at: string;
  is_visible: boolean;
}

export function LocationMap() {
  const { user } = useAuth();
  const { location, getCurrentLocation, loading: locationLoading } = useLocation();
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    loadMapboxScript();
    fetchUserLocations();
    
    // Subscribe to location updates
    const subscription = supabase
      .channel('user_locations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_locations' },
        () => fetchUserLocations()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (location && user) {
      updateUserLocation();
    }
  }, [location, user]);

  const loadMapboxScript = () => {
    if (window.mapboxgl) {
      initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.onload = initializeMap;
    document.head.appendChild(script);

    const link = document.createElement('link');
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  };

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    (window as any).mapboxgl.accessToken = MAPBOX_TOKEN;
    
    mapInstanceRef.current = new (window as any).mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 0],
      zoom: 2,
      attributionControl: false
    });

    mapInstanceRef.current.addControl(new (window as any).mapboxgl.NavigationControl());
    
    mapInstanceRef.current.on('load', () => {
      updateMapMarkers();
    });
  };

  const fetchUserLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_locations')
        .select(`
          *,
          users (username)
        `)
        .eq('is_visible', true);

      if (error) throw error;
      
      const locations = data?.map(loc => ({
        ...loc,
        username: loc.users?.username || 'Unknown User'
      })) || [];
      
      setUserLocations(locations);
      updateMapMarkers();
    } catch (error) {
      console.error('Error fetching user locations:', error);
    }
  };

  const updateUserLocation = async () => {
    if (!location || !user) return;

    try {
      const { error } = await supabase
        .from('user_locations')
        .upsert({
          user_id: user.id,
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city,
          country: location.country,
          is_visible: isVisible,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Location updated successfully!');
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    }
  };

  const updateMapMarkers = () => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add markers for each user location
    userLocations.forEach(userLoc => {
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      
      // Create marker element safely without innerHTML
      const markerDiv = document.createElement('div');
      markerDiv.className = 'w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg cursor-pointer transform hover:scale-110 transition-transform';
      // Safely set text content to prevent XSS
      markerDiv.textContent = userLoc.username.charAt(0).toUpperCase();
      el.appendChild(markerDiv);
      
      el.addEventListener('click', () => setSelectedUser(userLoc));

      new (window as any).mapboxgl.Marker(el)
        .setLngLat([userLoc.longitude, userLoc.latitude])
        .addTo(mapInstanceRef.current);
    });

    // Add current user marker if location is available
    if (location && user) {
      const currentUserEl = document.createElement('div');
      
      // Create current user marker element safely without innerHTML
      const currentMarkerDiv = document.createElement('div');
      currentMarkerDiv.className = 'w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold shadow-xl border-4 border-white animate-pulse';
      
      // Create SVG element programmatically
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'w-6 h-6');
      svg.setAttribute('fill', 'currentColor');
      svg.setAttribute('viewBox', '0 0 20 20');
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill-rule', 'evenodd');
      path.setAttribute('d', 'M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z');
      path.setAttribute('clip-rule', 'evenodd');
      
      svg.appendChild(path);
      currentMarkerDiv.appendChild(svg);
      currentUserEl.appendChild(currentMarkerDiv);

      new (window as any).mapboxgl.Marker(currentUserEl)
        .setLngLat([location.longitude, location.latitude])
        .addTo(mapInstanceRef.current);

      // Center map on user's location
      mapInstanceRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 10
      });
    }
  };

  const toggleVisibility = async () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);

    if (location && user) {
      try {
        const { error } = await supabase
          .from('user_locations')
          .upsert({
            user_id: user.id,
            latitude: location.latitude,
            longitude: location.longitude,
            city: location.city,
            country: location.country,
            is_visible: newVisibility,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        toast.success(newVisibility ? 'Location is now visible to others' : 'Location is now hidden');
      } catch (error) {
        console.error('Error updating visibility:', error);
        toast.error('Failed to update visibility');
      }
    }
  };

  const shareLocation = async () => {
    if (!location) return;

    const locationText = `📍 My location: ${location.city ? `${location.city}, ` : ''}${location.country || 'Unknown'}\nCoordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Location',
          text: locationText,
        });
      } catch (error) {
        navigator.clipboard.writeText(locationText);
        toast.success('Location copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(locationText);
      toast.success('Location copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4"
          >
            🗺️ Global Community
          </motion.h2>
          <p className="text-gray-300 text-lg">Discover where our community members are located around the world</p>
        </div>

        {/* Controls */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-purple-500/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={getCurrentLocation}
                disabled={locationLoading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50"
              >
                <Navigation className={`w-5 h-5 ${locationLoading ? 'animate-spin' : ''}`} />
                {locationLoading ? 'Getting Location...' : 'Get My Location'}
              </button>

              {location && (
                <button
                  onClick={toggleVisibility}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ${
                    isVisible 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {isVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  {isVisible ? 'Visible' : 'Hidden'}
                </button>
              )}

              {location && (
                <button
                  onClick={shareLocation}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-300"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 text-gray-300">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{userLocations.length} users online</span>
              </div>
              {location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <span>{location.city ? `${location.city}, ` : ''}{location.country || 'Unknown'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-purple-500/20">
          <div 
            ref={mapRef} 
            className="w-full h-96 md:h-[600px]"
            style={{ minHeight: '400px' }}
          />
        </div>

        {/* User Info Panel */}
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{selectedUser.username}</h3>
                <p className="text-gray-300">
                  📍 {selectedUser.city ? `${selectedUser.city}, ` : ''}{selectedUser.country || 'Unknown location'}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Last updated: {new Date(selectedUser.updated_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{userLocations.length}</div>
            <div className="text-gray-400">Active Users</div>
          </div>
          
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 text-center">
            <MapPin className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {new Set(userLocations.map(u => u.country)).size}
            </div>
            <div className="text-gray-400">Countries</div>
          </div>
          
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 text-center">
            <Navigation className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {location ? '✓' : '✗'}
            </div>
            <div className="text-gray-400">Your Location</div>
          </div>
        </div>
      </div>
    </div>
  );
}
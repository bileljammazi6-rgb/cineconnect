import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, Plus, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface LocationEvent {
  id: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  event_date: string;
  max_attendees?: number;
  created_by: string;
  created_at: string;
  users: {
    username: string;
    full_name?: string;
  };
  attendees?: {
    user_id: string;
    users: {
      username: string;
      full_name?: string;
    };
  }[];
}

export const LocationEvents: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<LocationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    max_attendees: '',
    address: ''
  });
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);

  useEffect(() => {
    if (user) {
      fetchEvents();
      getCurrentLocation();
    }
  }, [user]);

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const fetchEvents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('location_events')
        .select(`
          *,
          users (username, full_name),
          event_attendees (
            user_id,
            users (username, full_name)
          )
        `)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    if (!user || !userLocation || !newEvent.title.trim()) return;

    try {
      const { error } = await supabase.from('location_events').insert({
        title: newEvent.title.trim(),
        description: newEvent.description.trim(),
        location: userLocation,
        event_date: newEvent.event_date,
        max_attendees: newEvent.max_attendees ? parseInt(newEvent.max_attendees) : null,
        created_by: user.id
      });

      if (error) throw error;

      setNewEvent({
        title: '',
        description: '',
        event_date: '',
        max_attendees: '',
        address: ''
      });
      setShowCreateForm(false);
      fetchEvents();
      toast.success('Event created successfully!');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  const joinEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('event_attendees').insert({
        event_id: eventId,
        user_id: user.id
      });

      if (error) throw error;

      fetchEvents();
      toast.success('Joined event successfully!');
    } catch (error) {
      console.error('Error joining event:', error);
      toast.error('Failed to join event');
    }
  };

  const leaveEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      fetchEvents();
      toast.success('Left event successfully!');
    } catch (error) {
      console.error('Error leaving event:', error);
      toast.error('Failed to leave event');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to view location events.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Location Events</h2>
          <p className="text-gray-600">Discover and join movie events near you</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-6 shadow-sm border mb-6"
        >
          <h3 className="text-lg font-semibold mb-4">Create New Event</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title
              </label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Movie night, film discussion, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Describe your event..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.event_date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, event_date: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Attendees (optional)
                </label>
                <input
                  type="number"
                  value={newEvent.max_attendees}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, max_attendees: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={createEvent}
                disabled={!newEvent.title.trim() || !newEvent.event_date || !userLocation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Event
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm border animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => {
            const isAttending = event.attendees?.some(a => a.user_id === user.id);
            const attendeeCount = event.attendees?.length || 0;
            const distance = userLocation 
              ? calculateDistance(
                  userLocation.latitude, 
                  userLocation.longitude,
                  event.location.latitude,
                  event.location.longitude
                )
              : null;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg p-6 shadow-sm border"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {event.title}
                    </h3>
                    <p className="text-gray-600 mb-3">{event.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                        <span>{new Date(event.event_date).toLocaleTimeString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {attendeeCount} attending
                          {event.max_attendees && ` / ${event.max_attendees} max`}
                        </span>
                      </div>
                      
                      {distance && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{distance.toFixed(1)} km away</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Created {formatDistanceToNow(new Date(event.created_at))} ago</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {event.created_by === user.id ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm">
                        Your Event
                      </span>
                    ) : isAttending ? (
                      <button
                        onClick={() => leaveEvent(event.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Leave Event
                      </button>
                    ) : (
                      <button
                        onClick={() => joinEvent(event.id)}
                        disabled={!!(event.max_attendees && attendeeCount >= event.max_attendees)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {event.max_attendees && attendeeCount >= event.max_attendees 
                          ? 'Event Full' 
                          : 'Join Event'
                        }
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Organized by</span>
                      <span className="font-medium text-gray-900">
                        {event.users.full_name || event.users.username}
                      </span>
                    </div>
                    
                    {event.attendees && event.attendees.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Attendees:</span>
                        <div className="flex -space-x-2">
                          {event.attendees.slice(0, 3).map((attendee) => (
                            <div
                              key={attendee.user_id}
                              className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
                              title={attendee.users.full_name || attendee.users.username}
                            >
                              {attendee.users.username[0].toUpperCase()}
                            </div>
                          ))}
                          {event.attendees.length > 3 && (
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-semibold border-2 border-white">
                              +{event.attendees.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No events found</h3>
          <p className="text-gray-600">Be the first to create a movie event in your area!</p>
        </div>
      )}
    </div>
  );
};

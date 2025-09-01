'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'

interface Location {
    lat: number
    lng: number
}

interface CustomerLocation extends Location {
    address: string
}

interface MapComponentProps {
    driverLocation: Location
    customerLocation: CustomerLocation
    locationHistory: Location[]
}

const MapComponent: React.FC<MapComponentProps> = ({ driverLocation, customerLocation, locationHistory }) => {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<L.Map | null>(null)
    const driverMarkerRef = useRef<L.Marker | null>(null)
    const customerMarkerRef = useRef<L.Marker | null>(null)
    const userMarkerRef = useRef<L.Marker | null>(null)
    const pathRef = useRef<L.Polyline | null>(null)
    const [mapReady, setMapReady] = useState(false)
    const [userLocation, setUserLocation] = useState<Location | null>(null)
    const [isInitialized, setIsInitialized] = useState(false)

    // Get user's current location (only once)
    useEffect(() => {
        if (navigator.geolocation && !userLocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLoc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    }
                    setUserLocation(userLoc)
                },
                (error) => {
                    console.log('User location not available:', error.message)
                }
            )
        }
    }, []) // Empty dependency array - only run once

    // Initialize map only once
    useEffect(() => {
        if (!mapRef.current || isInitialized) return

        // Initialize map centered between driver and customer locations
        const centerLat = (driverLocation.lat + customerLocation.lat) / 2
        const centerLng = (driverLocation.lng + customerLocation.lng) / 2

        const map = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: true
        }).setView([centerLat, centerLng], 13)

        mapInstanceRef.current = map

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map)

        // Add custom zoom control (top-right)
        L.control.zoom({
            position: 'topright'
        }).addTo(map)

        // Add scale control
        L.control.scale({
            position: 'bottomleft'
        }).addTo(map)

        // Add driver location marker (blue car icon)
        const driverIcon = L.divIcon({
            className: 'driver-marker',
            html: '🚗',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        })

        const driverMarker = L.marker([driverLocation.lat, driverLocation.lng], {
            icon: driverIcon,
            zIndexOffset: 1000
        })
            .addTo(map)
            .bindPopup('🚗 Driver Location')
        driverMarkerRef.current = driverMarker

        // Add customer location marker (house icon)
        const customerIcon = L.divIcon({
            className: 'customer-marker',
            html: '🏠',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        })

        const customerMarker = L.marker([customerLocation.lat, customerLocation.lng], {
            icon: customerIcon,
            zIndexOffset: 999
        })
            .addTo(map)
            .bindPopup(`🏠 Delivery Address<br><strong>${customerLocation.address}</strong>`)
        customerMarkerRef.current = customerMarker

        // Add user location marker (green person icon) if available
        if (userLocation) {
            const userIcon = L.divIcon({
                className: 'user-marker',
                html: '📍',
                iconSize: [25, 25],
                iconAnchor: [12, 12]
            })

            const userMarker = L.marker([userLocation.lat, userLocation.lng], {
                icon: userIcon,
                zIndexOffset: 998
            })
                .addTo(map)
                .bindPopup('📍 Your Location')
            userMarkerRef.current = userMarker
        }

        // Add initial location history path if there are multiple points
        if (locationHistory.length > 1) {
            const pathCoords = locationHistory.map(loc => [loc.lat, loc.lng])
            const path = L.polyline(pathCoords as [number, number][], {
                color: 'blue',
                weight: 3,
                opacity: 0.7
            }).addTo(map)
            pathRef.current = path
        }

        // Fit map to show all points initially
        fitMapToPoints(map, locationHistory, driverLocation, customerLocation, userLocation)

        // Mark map as ready and initialized
        setMapReady(true)
        setIsInitialized(true)

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
            setMapReady(false)
            setIsInitialized(false)
        }
    }, []) // Empty dependency array - only run once

    // Update only markers and path when data changes (no map reinitialization)
    useEffect(() => {
        if (!mapInstanceRef.current || !isInitialized) return

        // Update driver location marker
        if (driverMarkerRef.current) {
            driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng])
        }

        // Update customer location marker
        if (customerMarkerRef.current) {
            customerMarkerRef.current.setLatLng([customerLocation.lat, customerLocation.lng])
            customerMarkerRef.current.getPopup()?.setContent(`🏠 Delivery Address<br><strong>${customerLocation.address}</strong>`)
        }

        // Update user location marker if available
        if (userLocation && userMarkerRef.current) {
            userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng])
        }

        // Update or create location history path
        if (locationHistory.length > 1) {
            const pathCoords = locationHistory.map(loc => [loc.lat, loc.lng])

            if (pathRef.current) {
                // Update existing path
                pathRef.current.setLatLngs(pathCoords as [number, number][])
            } else {
                // Create new path if it doesn't exist
                const path = L.polyline(pathCoords as [number, number][], {
                    color: 'blue',
                    weight: 3,
                    opacity: 0.7
                }).addTo(mapInstanceRef.current)
                pathRef.current = path
            }
        }

        // Only fit map if there are significant changes (new points added)
        if (locationHistory.length > 1) {
            // Check if we need to refit (only if new points are outside current view)
            const shouldRefit = shouldRefitMap()
            if (shouldRefit) {
                fitMapToPoints(mapInstanceRef.current, locationHistory, driverLocation, customerLocation, userLocation)
            }
        }
    }, [driverLocation.lat, driverLocation.lng, customerLocation.lat, customerLocation.lng, locationHistory.length]) // Only depend on actual values, not objects

    // Check if map needs refitting (only when new points are outside current view)
    const shouldRefitMap = useCallback((): boolean => {
        if (!mapInstanceRef.current || locationHistory.length < 2) return false

        const currentBounds = mapInstanceRef.current.getBounds()
        const newPoints = locationHistory.slice(-3) // Check last 3 points

        // Check if any new points are outside current view
        return newPoints.some(point => !currentBounds.contains([point.lat, point.lng]))
    }, [locationHistory.length])

    // Function to fit map to show all points with padding
    const fitMapToPoints = useCallback((map: L.Map, history: Location[], driver: Location, customer: CustomerLocation, user: Location | null) => {
        if (!map) return

        // Collect all points (driver location + customer location + history + user location)
        const allPoints: L.LatLng[] = [
            L.latLng(driver.lat, driver.lng),
            L.latLng(customer.lat, customer.lng)
        ]

        // Add history points
        history.forEach(loc => {
            allPoints.push(L.latLng(loc.lat, loc.lng))
        })

        // Add user location if available
        if (user) {
            allPoints.push(L.latLng(user.lat, user.lng))
        }

        // If we have multiple points, fit the map to show all of them
        if (allPoints.length > 1) {
            const bounds = L.latLngBounds(allPoints)

            // Add padding to ensure points aren't at the very edge
            const paddedBounds = bounds.pad(0.1) // 10% padding

            // Fit map to bounds with smooth animation
            map.fitBounds(paddedBounds, {
                animate: true,
                duration: 0.5,
                maxZoom: 18, // Prevent zooming in too far
                padding: [20, 20] // Additional padding in pixels
            })
        } else {
            // Single point: center on it with reasonable zoom
            map.setView([driver.lat, driver.lng], 15, {
                animate: true,
                duration: 0.5
            })
        }
    }, [])

    // Function to manually fit to points (for the button)
    const handleFitToPoints = useCallback(() => {
        if (mapInstanceRef.current) {
            fitMapToPoints(mapInstanceRef.current, locationHistory, driverLocation, customerLocation, userLocation)
        }
    }, [locationHistory, driverLocation, customerLocation, userLocation, fitMapToPoints])

    // Function to center on driver location
    const handleCenterOnDriver = useCallback(() => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([driverLocation.lat, driverLocation.lng], 16, {
                animate: true,
                duration: 0.5
            })
        }
    }, [driverLocation.lat, driverLocation.lng])

    // Function to center on customer location
    const handleCenterOnCustomer = useCallback(() => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([customerLocation.lat, customerLocation.lng], 16, {
                animate: true,
                duration: 0.5
            })
        }
    }, [customerLocation.lat, customerLocation.lng])

    // Function to center on user location
    const handleCenterOnUser = useCallback(() => {
        if (mapInstanceRef.current && userLocation) {
            mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 16, {
                animate: true,
                duration: 0.5
            })
        }
    }, [userLocation])

    return (
        <div className="relative">
            <div
                ref={mapRef}
                className="w-full h-[500px] border-2 border-gray-300 rounded-lg"
            />

            {/* Custom Map Controls */}
            {mapReady && (
                <div className="absolute top-4 left-4 z-[1000] space-y-2">
                    <button
                        onClick={handleFitToPoints}
                        className="bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg shadow-lg border border-gray-300 text-sm font-medium transition-colors"
                        title="Fit map to show all points"
                    >
                        📍 Fit All Points
                    </button>

                    <button
                        onClick={handleCenterOnDriver}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors"
                        title="Center on driver location"
                    >
                        🚗 Driver Location
                    </button>

                    <button
                        onClick={handleCenterOnCustomer}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors"
                        title="Center on customer location"
                    >
                        🏠 Customer Location
                    </button>

                    {userLocation && (
                        <button
                            onClick={handleCenterOnUser}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors"
                            title="Center on your location"
                        >
                            📍 Your Location
                        </button>
                    )}
                </div>
            )}

            {/* Map Info Panel */}
            {mapReady && (
                <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-300">
                    <div className="text-xs text-gray-600 space-y-1">
                        <div>🚗 Driver: {driverLocation.lat.toFixed(6)}, {driverLocation.lng.toFixed(6)}</div>
                        <div>🏠 Customer: {customerLocation.lat.toFixed(6)}, {customerLocation.lng.toFixed(6)}</div>
                        {userLocation && (
                            <div>📍 You: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}</div>
                        )}
                        <div>🛣️ Tracked Points: {locationHistory.length}</div>
                        <div>🗺️ Zoom: {mapInstanceRef.current?.getZoom() || 'N/A'}</div>
                    </div>
                </div>
            )}

            {/* Legend */}
            {mapReady && (
                <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-300">
                    <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl">🚗</span>
                            <span>Driver Location</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-xl">🏠</span>
                            <span>Customer Location</span>
                        </div>
                        {userLocation && (
                            <div className="flex items-center space-x-2">
                                <span className="text-xl">📍</span>
                                <span>Your Location</span>
                            </div>
                        )}
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-0.5 bg-blue-500"></div>
                            <span>Driver Path</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MapComponent 
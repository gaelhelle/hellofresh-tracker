'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the Map component to avoid SSR issues
const MapComponent = dynamic(() => import('../components/MapComponent'), {
    ssr: false,
    loading: () => (
        <div className="flex justify-center items-center h-[500px] bg-gray-100 rounded-lg text-xl text-gray-600">
            Loading map...
        </div>
    )
})

interface HelloFreshData {
    driverLocation: {
        latitude: number
        longitude: number
    }
    customerLocation: {
        latitude: number
        longitude: number
        address: string
    }
    // Add other properties as needed
}

export default function Home() {
    const [driverLocation, setDriverLocation] = useState<{
        lat: number
        lng: number
    } | null>(null)
    const [customerLocation, setCustomerLocation] = useState<{
        lat: number
        lng: number
        address: string
    } | null>(null)
    const [locationHistory, setLocationHistory] = useState<Array<{
        lat: number
        lng: number
        timestamp: Date
    }>>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Function to fetch data from HelloFresh API
    const fetchHelloFreshData = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch('https://us-central1-hellofresh-ca-prod.cloudfunctions.net/c_hf_getTraceyData?token=e05c9cfedb&screenWidth=500')

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data: HelloFreshData = await response.json()

            if (data.driverLocation && data.customerLocation) {
                const newDriverLocation = {
                    lat: data.driverLocation.latitude,
                    lng: data.driverLocation.longitude,
                }

                const newCustomerLocation = {
                    lat: data.customerLocation.latitude,
                    lng: data.customerLocation.longitude,
                    address: data.customerLocation.address
                }

                setDriverLocation(newDriverLocation)
                setCustomerLocation(newCustomerLocation)

                // Add driver location to history
                setLocationHistory(prev => [
                    ...prev,
                    {
                        ...newDriverLocation,
                        timestamp: new Date()
                    }
                ])
            } else {
                throw new Error('Driver or customer location not found in response')
            }
        } catch (err) {
            console.error('Error fetching HelloFresh data:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch data')
        } finally {
            setIsLoading(false)
        }
    }

    // Fetch initial data and set up interval
    useEffect(() => {
        fetchHelloFreshData()

        // Refresh data every 30 seconds
        const interval = setInterval(fetchHelloFreshData, 30000)

        return () => clearInterval(interval)
    }, [])

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-5">
            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-4xl font-bold text-gray-800">
                        HelloFresh Delivery Tracker
                    </h1>
                    <button
                        onClick={fetchHelloFreshData}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Refreshing...' : 'Refresh Now'}
                    </button>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-blue-700">
                        <strong>API Endpoint:</strong> HelloFresh Tracey Data API
                    </p>
                    <p className="text-sm text-blue-600">
                        <strong>Data Source:</strong> driverLocation & customerLocation from HelloFresh API
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {isLoading ? (
                        <div className="col-span-full bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                            <p className="font-semibold text-blue-800">Fetching delivery data from HelloFresh API...</p>
                        </div>
                    ) : error ? (
                        <div className="col-span-full bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                            <p className="font-semibold text-red-800">Error: {error}</p>
                        </div>
                    ) : driverLocation && customerLocation ? (
                        <>
                            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                <p className="font-semibold text-blue-800 mb-2">🚗 Driver Location</p>
                                <p className="text-sm text-blue-600">Lat: {driverLocation.lat.toFixed(6)}</p>
                                <p className="text-sm text-blue-600">Lng: {driverLocation.lng.toFixed(6)}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                                <p className="font-semibold text-green-800 mb-2">🏠 Customer Location</p>
                                <p className="text-sm text-green-600">Lat: {customerLocation.lat.toFixed(6)}</p>
                                <p className="text-sm text-green-600">Lng: {customerLocation.lng.toFixed(6)}</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                                <p className="font-semibold text-purple-800 mb-2">📍 Delivery Address</p>
                                <p className="text-sm text-purple-600">{customerLocation.address}</p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                                <p className="font-semibold text-orange-800 mb-2">Tracking Status</p>
                                <p className="text-sm text-orange-600">Active (30s refresh)</p>
                                <p className="text-xs text-orange-500 mt-1">API: Connected</p>
                            </div>
                        </>
                    ) : (
                        <div className="col-span-full bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                            <p className="font-semibold text-yellow-800">No delivery data available</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
                {driverLocation && customerLocation && !isLoading && !error ? (
                    <MapComponent
                        driverLocation={driverLocation}
                        customerLocation={customerLocation}
                        locationHistory={locationHistory.map(loc => ({ lat: loc.lat, lng: loc.lng }))}
                    />
                ) : (
                    <div className="flex justify-center items-center h-[500px] bg-gray-100 rounded-lg text-xl text-gray-600">
                        {isLoading ? 'Loading map...' : error ? 'Error loading map' : 'No delivery data'}
                    </div>
                )}
            </div>

            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Driver Location History</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {locationHistory.slice(-10).reverse().map((location, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                            <span className="text-sm text-gray-600 font-mono">
                                Lat: {location.lat.toFixed(6)}
                            </span>
                            <span className="text-sm text-gray-600 font-mono">
                                Lng: {location.lng.toFixed(6)}
                            </span>
                            <span className="text-sm text-gray-600">
                                {location.timestamp.toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                    {locationHistory.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            No driver location history yet. Data will be fetched from HelloFresh API...
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
} 
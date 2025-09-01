import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Call the HelloFresh API
    const response = await fetch('https://us-central1-hellofresh-ca-prod.cloudfunctions.net/c_hf_getTraceyData?token=e05c9cfedb&screenWidth=500')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Check if driverLocation exists
    if (!data.driverLocation) {
      throw new Error('No driver location found in response')
    }
    
    // Return the data to n8n
    return NextResponse.json({
      success: true,
      data: data,
      driverLocation: data.driverLocation,
      timestamp: new Date().toISOString(),
      message: 'HelloFresh driver location retrieved successfully'
    })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'HelloFresh driver location webhook endpoint',
    usage: 'POST to this endpoint to trigger driver location fetch',
    timestamp: new Date().toISOString()
  })
} 
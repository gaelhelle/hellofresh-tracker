import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const sendData = async () => {
        try {
          const response = await fetch('https://us-central1-hellofresh-ca-prod.cloudfunctions.net/c_hf_getTraceyData?token=e05c9cfedb&screenWidth=500')
          
          if (response.ok) {
            const data = await response.json()
            
            // Check if driverLocation exists
            if (!data.driverLocation) {
              throw new Error('No driver location found in response')
            }
            
            const eventData = {
              event: 'hellofresh-update',
              data: JSON.stringify({
                success: true,
                data: data,
                driverLocation: data.driverLocation,
                timestamp: new Date().toISOString()
              })
            }
            
            // Send SSE data
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(eventData)}\n\n`))
          }
        } catch (error) {
          const errorData = {
            event: 'error',
            data: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            })
          }
          
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorData)}\n\n`))
        }
      }
      
      // Send initial data
      sendData()
      
      // Send data every 10 seconds
      const interval = setInterval(sendData, 10000)
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
} 
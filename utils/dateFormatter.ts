/**
 * Utility functions for formatting HelloFresh timestamps in Vancouver timezone
 */

export interface HelloFreshTimeData {
  plannedTimeOfArrival: string
  // Add other time fields as needed
}

// Vancouver timezone options
const VANCOUVER_OPTIONS = {
  timeZone: 'America/Vancouver',
  year: 'numeric' as const,
  month: 'long' as const,
  day: 'numeric' as const,
  hour: '2-digit' as const,
  minute: '2-digit' as const,
  timeZoneName: 'short' as const
}

/**
 * Format ISO timestamp to readable string in Vancouver time
 */
export function formatPlannedTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      ...VANCOUVER_OPTIONS,
      weekday: 'long'
    })
    
    return formatter.format(date)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Date formatting error'
  }
}

/**
 * Format to short date (MM/DD/YYYY) in Vancouver time
 */
export function formatShortDate(isoString: string): string {
  try {
    const date = new Date(isoString)
    
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Vancouver',
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
    
    return formatter.format(date)
  } catch (error) {
    console.error('Error formatting short date:', error)
    return 'Date formatting error'
  }
}

/**
 * Format to time only (HH:MM AM/PM) in Vancouver time
 */
export function formatTimeOnly(isoString: string): string {
  try {
    const date = new Date(isoString)
    
    if (isNaN(date.getTime())) {
      return 'Invalid time'
    }
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Vancouver',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    
    return formatter.format(date)
  } catch (error) {
    console.error('Error formatting time:', error)
    return 'Time formatting error'
  }
}

/**
 * Get relative time (e.g., "in 2 hours", "2 days ago") in Vancouver time
 */
export function getRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    const now = new Date()
    
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    
    const diffInMs = date.getTime() - now.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInMs < 0) {
      // Past time
      if (Math.abs(diffInDays) > 0) {
        return `${Math.abs(diffInDays)} day${Math.abs(diffInDays) !== 1 ? 's' : ''} ago`
      } else if (Math.abs(diffInHours) > 0) {
        return `${Math.abs(diffInHours)} hour${Math.abs(diffInHours) !== 1 ? 's' : ''} ago`
      } else {
        return `${Math.abs(diffInMinutes)} minute${Math.abs(diffInMinutes) !== 1 ? 's' : ''} ago`
      }
    } else {
      // Future time
      if (diffInDays > 0) {
        return `in ${diffInDays} day${diffInDays !== 1 ? 's' : ''}`
      } else if (diffInHours > 0) {
        return `in ${diffInHours} hour${diffInHours !== 1 ? 's' : ''}`
      } else {
        return `in ${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''}`
      }
    }
  } catch (error) {
    console.error('Error getting relative time:', error)
    return 'Time calculation error'
  }
}

/**
 * Check if time is in the past in Vancouver time
 */
export function isTimeInPast(isoString: string): boolean {
  try {
    const date = new Date(isoString)
    const now = new Date()
    
    if (isNaN(date.getTime())) {
      return false
    }
    
    return date < now
  } catch (error) {
    console.error('Error checking if time is in past:', error)
    return false
  }
}

/**
 * Get time status (Past, Present, Future) in Vancouver time
 */
export function getTimeStatus(isoString: string): 'past' | 'present' | 'future' {
  try {
    const date = new Date(isoString)
    const now = new Date()
    
    if (isNaN(date.getTime())) {
      return 'present'
    }
    
    const diffInMs = Math.abs(date.getTime() - now.getTime())
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    
    if (diffInMinutes <= 5) {
      return 'present' // Within 5 minutes
    } else if (date < now) {
      return 'past'
    } else {
      return 'future'
    }
  } catch (error) {
    console.error('Error getting time status:', error)
    return 'present'
  }
}

/**
 * Format to Vancouver timezone with custom options
 */
export function formatVancouverTime(isoString: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    const date = new Date(isoString)
    
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Vancouver',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      ...defaultOptions,
      ...options
    })
    
    return formatter.format(date)
  } catch (error) {
    console.error('Error formatting Vancouver time:', error)
    return 'Time formatting error'
  }
}

/**
 * Get current Vancouver time
 */
export function getCurrentVancouverTime(): string {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Vancouver',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    })
    
    return formatter.format(now)
  } catch (error) {
    console.error('Error getting current Vancouver time:', error)
    return 'Time error'
  }
} 
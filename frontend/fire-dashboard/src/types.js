/**
 * @typedef {Object} RawIncident
 * @property {string} id
 * @property {string} device_id
 * @property {string=} alarm_type
 * @property {number=} confidence
 * @property {string=} created_at
 * @property {Object.<string, any>=} payload
 */

/**
 * @typedef {Object} SensorPoint
 * @property {string} ts      // formatted timestamp for charts
 * @property {number} smoke
 * @property {number} temp
 */

/**
 * @typedef {Object} Incident
 * @property {string} id
 * @property {string} device_id
 * @property {string=} alarm_type
 * @property {number} confidence
 * @property {string=} created_at
 * @property {Object.<string, any>=} payload
 *
 * @property {number} lat
 * @property {number} lon
 * @property {SensorPoint[]} sensor_timeline
 * @property {"confirmed" | "probable" | "low" | "unknown"=} severity
 * @property {{ name?: string, phone?: string }=} user
 * @property {string=} status
 * @property {{ ts: string, user: string, action: string, payload?: any }[]} notes
 */

// Export nothing—JS only needs this file for IntelliSense.
export {};

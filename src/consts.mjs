/**
 * Prefix of the master record
 */
export const MASTER = "master";

/**
 * Current schema version
 */
export const SCHEMA_VERSION_1 = "1";

/**
 * future schema with type + name
 */
export const SCHEMA_VERSION_2 = "2";

/**
 * Prefix of the categories.
 * Will be followed by the category name
 */
export const CATEGORY_PREFIX = "categories.";

/**
 * Prefix of the meters.
 * Will be followed by the category and meter name
 */
export const METER_PREFIX = "meters.";

/**
 * Prefix of the notes.
 * Will be followed by the category and note time
 */
export const NOTE_PREFIX = "notes.";

/**
 * Prefix of the values.
 * Will be followed by the category name
 */
export const VALUE_PREFIX = "values.";

export const METER_ATTRIBUTES = {
    /**
     * Physical unit.
     * @return {string}
     */
    unit: { type: "string" },
  
    /**
     * Precission
     * @return {number}
     */
    fractionalDigits: { type: "number", default: 2 }
  };
  
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
 * Prefix of the values.
 * Will be followed by the category name
 */
export const VALUE_PREFIX = "values.";

export const METER_ATTRIBUTES = {
  /**
   * Physical unit.
   * @return {string}
   */
  unit: { type: "string", writable: true },

  /**
   * Precission
   * @return {number}
   */
  fractionalDigits: { type: "number", default: 2, writable: true }
};

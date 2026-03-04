/**
 * Configuration Management
 * Handles reading and validating configuration from Script Properties
 */

/**
 * Get configuration from Script Properties
 * @returns {Object} Configuration object
 */
function getConfig() {
  const props = PropertiesService.getScriptProperties();

  const config = {
    TELEGRAM_BOT_TOKEN: props.getProperty('TELEGRAM_BOT_TOKEN') || '',
    TELEGRAM_CHAT_ID: props.getProperty('TELEGRAM_CHAT_ID') || '',
    WARNING_THRESHOLD: parseInt(props.getProperty('WARNING_THRESHOLD') || '90'),
    CRITICAL_THRESHOLD: parseInt(props.getProperty('CRITICAL_THRESHOLD') || '100'),
    ENABLE_ALERTS: props.getProperty('ENABLE_ALERTS') !== 'false'
  };

  return config;
}

/**
 * Set a configuration value in Script Properties
 * @param {string} key Configuration key
 * @param {string|number|boolean} value Configuration value
 */
function setConfig(key, value) {
  try {
    PropertiesService.getScriptProperties().setProperty(key, value.toString());
    Logger.log(`Config updated: ${key} = ${value}`);
  } catch (error) {
    Logger.log(`Failed to set config ${key}: ${error.message}`);
    throw error;
  }
}

/**
 * Set multiple configuration values at once
 * @param {Object} configObject Object with key-value pairs
 */
function setMultipleConfig(configObject) {
  try {
    PropertiesService.getScriptProperties().setProperties(configObject);
    Logger.log(`Multiple configs updated: ${Object.keys(configObject).join(', ')}`);
  } catch (error) {
    Logger.log(`Failed to set multiple configs: ${error.message}`);
    throw error;
  }
}

/**
 * Validate configuration
 * Throws error if configuration is invalid
 * @param {Object} config Configuration object
 * @returns {boolean} True if valid
 */
function validateConfig(config) {
  const errors = [];

  // Validate bot token
  if (!config.TELEGRAM_BOT_TOKEN || config.TELEGRAM_BOT_TOKEN.length < 20) {
    errors.push('Invalid TELEGRAM_BOT_TOKEN: Must be at least 20 characters');
  }

  // Validate chat ID
  if (!config.TELEGRAM_CHAT_ID) {
    errors.push('Missing TELEGRAM_CHAT_ID: Required for sending alerts');
  }

  // Validate thresholds
  if (config.WARNING_THRESHOLD < 0 || config.WARNING_THRESHOLD > 100) {
    errors.push('WARNING_THRESHOLD must be between 0-100');
  }

  if (config.CRITICAL_THRESHOLD < 0 || config.CRITICAL_THRESHOLD > 100) {
    errors.push('CRITICAL_THRESHOLD must be between 0-100');
  }

  if (config.CRITICAL_THRESHOLD <= config.WARNING_THRESHOLD) {
    errors.push('CRITICAL_THRESHOLD must be greater than WARNING_THRESHOLD');
  }

  if (errors.length > 0) {
    const errorMessage = 'Configuration errors:\n' + errors.join('\n');
    Logger.log(errorMessage);
    throw new Error(errorMessage);
  }

  return true;
}


/**
 * Initialize configuration with default values
 * Only sets values that don't already exist
 */
function initializeConfig() {
  const props = PropertiesService.getScriptProperties();
  const defaults = {
    'WARNING_THRESHOLD': '90',
    'CRITICAL_THRESHOLD': '100',
    'ENABLE_ALERTS': 'true'
  };

  Object.keys(defaults).forEach(key => {
    if (!props.getProperty(key)) {
      props.setProperty(key, defaults[key]);
      Logger.log(`Initialized ${key} = ${defaults[key]}`);
    }
  });

  Logger.log('Configuration initialized with defaults');
}

/**
 * Print current configuration (for debugging)
 * Masks sensitive values
 */
function debugPrintConfig() {
  const config = getConfig();

  Logger.log('=== Current Configuration ===');
  Logger.log(`TELEGRAM_BOT_TOKEN: ${config.TELEGRAM_BOT_TOKEN ? '***' + config.TELEGRAM_BOT_TOKEN.substring(config.TELEGRAM_BOT_TOKEN.length - 4) : 'NOT SET'}`);
  Logger.log(`TELEGRAM_CHAT_ID: ${config.TELEGRAM_CHAT_ID || 'NOT SET'}`);
  Logger.log(`WARNING_THRESHOLD: ${config.WARNING_THRESHOLD}%`);
  Logger.log(`CRITICAL_THRESHOLD: ${config.CRITICAL_THRESHOLD}%`);
  Logger.log(`ENABLE_ALERTS: ${config.ENABLE_ALERTS}`);
  Logger.log('============================');
}

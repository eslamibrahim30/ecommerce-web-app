/**
 * Form Validation Utility
 * Provides regex-based validation with custom error messages
 */

import { toast } from './notifications.js';

// Validation rules with regex patterns and error messages
export const validationRules = {
    email: {
        pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        message: "Please enter a valid email address (e.g., user@example.com)"
    },

    password: {
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)"
    },

    productName: {
        pattern: /^[a-zA-Z0-9\s\-&'().]{2,100}$/,
        message: "Product name must be 2-100 characters (letters, numbers, spaces, -, &, ', (), . allowed)"
    },

    categoryName: {
        pattern: /^[a-zA-Z0-9\s\-&']{2,50}$/,
        message: "Category name must be 2-50 characters (letters, numbers, spaces, -, &, ' allowed)"
    },

    price: {
        pattern: /^\d+(\.\d{1,2})?$/,
        message: "Price must be a valid number (e.g., 99 or 99.99)"
    },

    description: {
        pattern: /^[\s\S]{10,500}$/,
        message: "Description must be between 10 and 500 characters"
    },

    imageUrl: {
        pattern: /^(\/|https?:\/\/).+\.(jpg|jpeg|png|gif|webp|svg)$/i,
        message: "Please enter a valid image URL (.jpg, .png, .gif, .webp, .svg)"
    },

    required: {
        pattern: /^.+$/,
        message: "This field is required"
    }
};

/**
 * Validate a single value against a validation rule
 * @param {string} value - The value to validate
 * @param {string} ruleName - The name of the validation rule
 * @param {boolean} showToast - Whether to show toast notification on error
 * @returns {boolean} - True if valid, false otherwise
 */
export function validate(value, ruleName, showToast = true) {
    const rule = validationRules[ruleName];

    if (!rule) {
        console.error(`Validation rule "${ruleName}" not found`);
        return false;
    }

    const isValid = rule.pattern.test(value);

    if (!isValid && showToast) {
        toast.error(rule.message);
    }

    return isValid;
}

/**
 * Validate multiple fields at once
 * @param {Object} fields - Object with field names as keys and values to validate
 * @param {Object} rules - Object with field names as keys and rule names as values
 * @param {boolean} showToast - Whether to show toast notifications
 * @returns {boolean} - True if all fields are valid
 */
export function validateFields(fields, rules, showToast = true) {
    for (const [fieldName, value] of Object.entries(fields)) {
        const ruleName = rules[fieldName];

        if (ruleName && !validate(value, ruleName, showToast)) {
            return false;
        }
    }

    return true;
}

/**
 * Validate that a number is greater than a minimum value
 * @param {number} value - The value to validate
 * @param {number} min - Minimum allowed value
 * @param {string} fieldName - Name of the field for error message
 * @param {boolean} showToast - Whether to show toast notification
 * @returns {boolean} - True if valid
 */
export function validateMin(value, min, fieldName = "Value", showToast = true) {
    const numValue = parseFloat(value);

    if (isNaN(numValue) || numValue < min) {
        if (showToast) {
            toast.error(`${fieldName} must be at least ${min}`);
        }
        return false;
    }

    return true;
}

/**
 * Validate that two values match (e.g., password confirmation)
 * @param {string} value1 - First value
 * @param {string} value2 - Second value
 * @param {string} fieldName - Name of the field for error message
 * @param {boolean} showToast - Whether to show toast notification
 * @returns {boolean} - True if values match
 */
export function validateMatch(value1, value2, fieldName = "Values", showToast = true) {
    if (value1 !== value2) {
        if (showToast) {
            toast.error(`${fieldName} do not match`);
        }
        return false;
    }

    return true;
}

/**
 * Get validation pattern for HTML5 pattern attribute
 * @param {string} ruleName - The name of the validation rule
 * @returns {string} - The regex pattern as a string
 */
export function getPattern(ruleName) {
    const rule = validationRules[ruleName];
    return rule ? rule.pattern.source : '';
}

/**
 * Get validation message for a rule
 * @param {string} ruleName - The name of the validation rule
 * @returns {string} - The error message
 */
export function getMessage(ruleName) {
    const rule = validationRules[ruleName];
    return rule ? rule.message : '';
}

// Make validation functions available globally for non-module scripts
if (typeof window !== 'undefined') {
    window.validate = validate;
    window.validateFields = validateFields;
    window.validateMin = validateMin;
    window.validateMatch = validateMatch;
    window.validationRules = validationRules;
}

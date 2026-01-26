/**
 * Custom Notification System
 * Provides toast notifications and confirmation modals
 */

// Toast notification container
let toastContainer = null;

// Map to track active toasts by message+type combination
const activeToasts = new Map();

/**
 * Initialize the toast container
 */
function initToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
export function showToast(message, type = 'info', duration = 4000) {
    initToastContainer();

    // Create unique key for this message+type combination
    const toastKey = `${type}:${message}`;

    // Check if this toast already exists
    if (activeToasts.has(toastKey)) {
        const existingToast = activeToasts.get(toastKey);

        // Clear the existing timeout
        if (existingToast.timeoutId) {
            clearTimeout(existingToast.timeoutId);
        }

        // Add pulse animation to show the notification was triggered again
        existingToast.element.classList.add('toast-pulse');
        setTimeout(() => {
            existingToast.element.classList.remove('toast-pulse');
        }, 300);

        // Reset the auto-dismiss timer
        if (duration > 0) {
            existingToast.timeoutId = setTimeout(() => {
                removeToast(existingToast.element);
                activeToasts.delete(toastKey);
            }, duration);
        }

        return existingToast.element;
    }

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icon based on type
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-message">${message}</div>
    <button class="toast-close" aria-label="Close">&times;</button>
  `;

    toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('toast-show'), 10);

    // Close button handler
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.onclick = () => {
        removeToast(toast);
        activeToasts.delete(toastKey);
    };

    // Store toast reference with timeout ID
    const toastData = {
        element: toast,
        timeoutId: null
    };

    // Auto-dismiss
    if (duration > 0) {
        toastData.timeoutId = setTimeout(() => {
            removeToast(toast);
            activeToasts.delete(toastKey);
        }, duration);
    }

    activeToasts.set(toastKey, toastData);

    return toast;
}

/**
 * Remove a toast notification
 * @param {HTMLElement} toast - The toast element to remove
 */
function removeToast(toast) {
    if (!toast || !toast.parentElement) return;

    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');

    setTimeout(() => {
        if (toast.parentElement) {
            toast.parentElement.removeChild(toast);
        }
    }, 300);
}

/**
 * Show a confirmation modal
 * @param {string} message - The confirmation message
 * @param {Function} onConfirm - Callback when user confirms
 * @param {Function} onCancel - Callback when user cancels (optional)
 * @param {Object} options - Additional options (confirmText, cancelText, title)
 * @returns {Promise} - Resolves to true if confirmed, false if cancelled
 */
export function showConfirm(message, onConfirm = null, onCancel = null, options = {}) {
    return new Promise((resolve) => {
        const {
            title = 'Confirm Action',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            confirmClass = 'btn-confirm',
            cancelClass = 'btn-cancel'
        } = options;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-dialog';
        modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
      </div>
      <div class="modal-body">
        <p class="modal-message">${message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn ${cancelClass}" data-action="cancel">${cancelText}</button>
        <button class="btn ${confirmClass}" data-action="confirm">${confirmText}</button>
      </div>
    `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Trigger animation
        setTimeout(() => {
            overlay.classList.add('modal-show');
        }, 10);

        // Handle button clicks
        const handleAction = (confirmed) => {
            overlay.classList.remove('modal-show');

            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 300);

            if (confirmed) {
                if (onConfirm) onConfirm();
                resolve(true);
            } else {
                if (onCancel) onCancel();
                resolve(false);
            }
        };

        modal.querySelector('[data-action="confirm"]').onclick = () => handleAction(true);
        modal.querySelector('[data-action="cancel"]').onclick = () => handleAction(false);

        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                handleAction(false);
            }
        };

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                handleAction(false);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    });
}

// Convenience methods
export const toast = {
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    warning: (message, duration) => showToast(message, 'warning', duration),
    info: (message, duration) => showToast(message, 'info', duration)
};

// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
    window.showToast = showToast;
    window.showConfirm = showConfirm;
    window.toast = toast;
}

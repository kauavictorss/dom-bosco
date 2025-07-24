// Utility functions
export function formatDuration(decimalHours) {
    if (typeof decimalHours !== 'number' || isNaN(decimalHours)) {
        return 'N/A';
    }
    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let parts = [];
    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    // Only add minutes if there are any, or if it's 0 hours and 0 minutes
    if (minutes > 0 || (hours === 0 && totalMinutes === 0)) {
        parts.push(`${minutes}min`);
    }
    
    // Fallback for cases where calculation results in empty parts but decimalHours is explicitly 0
    if (parts.length === 0 && decimalHours === 0) {
        return '0min';
    }
    
    return parts.join(' ');
}

export function convertTimeToDecimalHours(timeString) {
    if (!timeString || timeString === '00:00') {
        return 0;
    }
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + (minutes / 60);
}
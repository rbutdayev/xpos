export const formatDate = (date: string | Date): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

export const formatDateTime = (date: string | Date): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const formatServiceStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
        'pending': 'Gözləyir',
        'in_progress': 'Davam edir',
        'completed': 'Tamamlandı',
        'cancelled': 'Ləğv edildi'
    };
    return statusMap[status] || status;
};

export const formatPaymentStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
        'paid': 'Ödənilib',
        'partial': 'Qismən',
        'credit': 'Borc',
        'unpaid': 'Ödənilməyib'
    };
    return statusMap[status] || status;
};

export const formatVehicleInfo = (vehicle: any): string => {
    if (!vehicle) return '';
    return `${vehicle.make || ''} ${vehicle.model || ''} (${vehicle.license_plate || ''})`.trim();
};

export const formatEmployeeName = (employee: any): string => {
    if (!employee) return '';
    return `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
};

export const truncateText = (text: string, maxLength: number = 50): string => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};
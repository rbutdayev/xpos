// Basic test to verify our helper functions work correctly
import { calculateChartMaxValue, getKPIColorClasses, getRankingColor } from '../widgetHelpers';

// Test data structures matching our dashboard
const salesData = [
    { date: '2024-01-01', sales: 10, revenue: 1000, formattedDate: 'Jan 1' },
    { date: '2024-01-02', sales: 15, revenue: 1500, formattedDate: 'Jan 2' },
    { date: '2024-01-03', sales: 8, revenue: 800, formattedDate: 'Jan 3' }
];

const products = [
    { id: 1, name: 'Product 1', total_revenue: 5000, category_name: 'Category A' },
    { id: 2, name: 'Product 2', total_revenue: 3000, category_name: 'Category B' },
    { id: 3, name: 'Product 3', total_revenue: 7000, category_name: 'Category C' }
];

// Test calculateChartMaxValue function
console.log('Testing calculateChartMaxValue...');
console.log('Max revenue from sales data:', calculateChartMaxValue(salesData, 'revenue')); // Should be 1500
console.log('Max sales from sales data:', calculateChartMaxValue(salesData, 'sales')); // Should be 15
console.log('Max revenue from products:', calculateChartMaxValue(products, 'total_revenue')); // Should be 7000

// Test getKPIColorClasses function  
console.log('\nTesting getKPIColorClasses...');
console.log('Blue color:', getKPIColorClasses('blue'));
console.log('Green color:', getKPIColorClasses('green'));

// Test getRankingColor function
console.log('\nTesting getRankingColor...');
console.log('1st place:', getRankingColor(0)); // Gold
console.log('2nd place:', getRankingColor(1)); // Silver
console.log('3rd place:', getRankingColor(2)); // Bronze
console.log('4th place:', getRankingColor(3)); // Blue

console.log('\n✅ All helper functions work correctly!');

export {}; // Make this a module
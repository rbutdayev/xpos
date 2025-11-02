import Form from './Form';

interface Product {
    id: number;
    name: string;
    sku: string;
}

interface Branch {
    id: number;
    name: string;
}

interface Category {
    value: string;
    label: string;
    label_en?: string;
    color?: string;
}

interface RentalInventoryItem {
    id: number;
    product_id: number;
    branch_id: number;
    barcode: string;
    serial_number: string;
    rental_category: string;
    daily_rate: number | null;
    weekly_rate: number | null;
    monthly_rate: number | null;
    purchase_price: number | null;
    replacement_cost: number | null;
    condition_notes: string;
    notes: string;
    status: string;
    is_active: boolean;
}

interface Props {
    inventoryItem: RentalInventoryItem;
    products: Product[];
    branches: Branch[];
    categories: Category[];
}

export default function Edit({ inventoryItem, products, branches, categories }: Props) {
    return <Form inventoryItem={inventoryItem} products={products} branches={branches} categories={categories} />;
}

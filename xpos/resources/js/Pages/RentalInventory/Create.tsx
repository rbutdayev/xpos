import Form from './Form';

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

interface Props {
    branches: Branch[];
    categories: Category[];
}

export default function Create({ branches, categories }: Props) {
    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <Form branches={branches} categories={categories} />
        </div>
    );
}

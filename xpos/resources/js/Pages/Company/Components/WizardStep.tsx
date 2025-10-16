import { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export default function WizardStep({ title, description, children }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="grid grid-cols-1 gap-6">{children}</div>
    </div>
  );
}


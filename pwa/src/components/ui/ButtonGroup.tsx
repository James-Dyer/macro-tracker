interface ButtonGroupProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3;
}

export function ButtonGroup<T extends string>({
  options,
  value,
  onChange,
  columns = 3
}: ButtonGroupProps<T>) {
  const gridColsClass = columns === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className={`grid ${gridColsClass} gap-2`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`
            py-3 px-4 rounded-xl font-medium text-sm transition-all
            ${value === option.value
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap: Record<NonNullable<LoaderProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Loader({ size = 'md' }: LoaderProps) {
  return (
    <div className="flex items-center justify-center py-4">
      <div
        className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${sizeMap[size]}`}
      />
    </div>
  );
}


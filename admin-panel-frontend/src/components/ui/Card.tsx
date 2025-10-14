import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn('p-6 pb-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }: CardProps) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-white', className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: CardProps) {
  return (
    <p className={cn('text-sm text-gray-600 dark:text-gray-300', className)} {...props} />
  );
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardProps) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

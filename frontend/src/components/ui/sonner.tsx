import { Toaster as Sonner, ToasterProps } from "sonner";

/**
 * Custom Toaster with premium styling.
 * Supports dark mode via CSS variables and uses a modern design.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      position="top-right"
      richColors
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-gray-800 group-[.toaster]:text-gray-900 dark:group-[.toaster]:text-gray-100 group-[.toaster]:border-gray-200 dark:group-[.toaster]:border-gray-700 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl',
          title: 'group-[.toast]:text-gray-900 dark:group-[.toast]:text-gray-100 group-[.toast]:font-semibold',
          description: 'group-[.toast]:text-gray-500 dark:group-[.toast]:text-gray-400 group-[.toast]:text-sm',
          actionButton: 'group-[.toast]:bg-blue-500 group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:font-medium',
          cancelButton: 'group-[.toast]:bg-gray-100 dark:group-[.toast]:bg-gray-700 group-[.toast]:text-gray-600 dark:group-[.toast]:text-gray-300 group-[.toast]:rounded-lg',
          closeButton: 'group-[.toast]:bg-gray-100 dark:group-[.toast]:bg-gray-700 group-[.toast]:border-gray-200 dark:group-[.toast]:border-gray-600',
        },
      }}
      style={
        {
          "--normal-bg": "var(--card, white)",
          "--normal-text": "var(--foreground, #0f172a)",
          "--normal-border": "var(--border, #e2e8f0)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
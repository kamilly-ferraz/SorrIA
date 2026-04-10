interface SorrIABrandProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  invertContrast?: boolean;
}

export default function SorrIABrand({ className = '', size = 'md', invertContrast = false }: SorrIABrandProps) {
  const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' };
  const darkBlue = invertContrast ? 'text-blue-200' : 'text-[#1E3A8A]';
  const lightBlue = invertContrast ? 'text-white' : 'text-[#3B82F6]';

  return (
    <span className={`font-bold ${sizes[size]} ${className}`}>
      <span className={darkBlue}>Sorr</span>
      <span className={lightBlue}>IA</span>
    </span>
  );
}

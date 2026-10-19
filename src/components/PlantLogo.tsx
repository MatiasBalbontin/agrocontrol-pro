import React from 'react';

interface PlantLogoProps {
  className?: string;
  size?: number;
}

export const PlantLogo: React.FC<PlantLogoProps> = ({ className = 'w-10 h-10' }) => {
  return (
    <div className={`relative rounded-xl overflow-hidden shadow-xs flex items-center justify-center bg-slate-900 border border-emerald-500/30 shrink-0 ${className}`}>
      <img
        src="./icon.png"
        alt="AgroControl Sprout"
        className="w-full h-full object-cover"
        onError={(e) => {
          // Si la imagen relativa falla, mostrar SVG vectorial directamente
          const parent = e.currentTarget.parentElement;
          if (parent) {
            e.currentTarget.style.display = 'none';
            const svgFallback = document.createElement('div');
            svgFallback.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                <path d="M7 20h10" />
                <path d="M10 20c5.5-2.5.8-6.4 3-10" />
                <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
                <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
              </svg>
            `;
            parent.appendChild(svgFallback);
          }
        }}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SlAnimationProps {
  onClose: () => void;
}

export const SlAnimation: React.FC<SlAnimationProps> = ({ onClose }) => {
  const [posX, setPosX] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosX(prev => {
        if (prev < -600) {
          onClose();
          return prev;
        }
        return prev - 12;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onClose]);

  const trainAscii = `
      ====        ________                _____
  _D _|  |_______/        \\__I_I_____===__|_________|
   |(_)---  |   H\\________/ |   |        |  |        |
   /     |  |   H  |  |     |   |        |  |        |
  |      |  |   H  |__|     |   |        |  |        |
  |______|__|___H___________|___|________|__|________|
   (O)____(O)    (O)____(O)  (O)____(O)   (O)____(O)
`;

  return (
    <div className="relative w-full h-full bg-zinc-950 text-amber-400 font-mono text-xs rounded-lg overflow-hidden flex flex-col justify-center items-start border border-zinc-800 p-4 select-none">
      <div className="absolute top-3 right-3">
        <button
          onClick={onClose}
          className="bg-zinc-800 hover:bg-rose-600 text-zinc-200 hover:text-white px-2.5 py-1 rounded text-xs transition flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" /> Passer
        </button>
      </div>

      <div
        className="whitespace-pre transition-transform duration-75"
        style={{ transform: `translateX(${posX}px)` }}
      >
        {trainAscii}
      </div>
      <p className="text-zinc-500 text-xs mt-4 italic text-center w-full">
        Tchou tchou ! (Commande 'sl' en cas d'erreur de frappe pour 'ls')
      </p>
    </div>
  );
};

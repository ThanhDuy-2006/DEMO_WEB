import React from 'react';
import './ProductCard.css';

const ProductCard = ({ product, onActivate }) => {
  const {
    name,
    category,
    duration,
    features,
    price,
    original_price,
    badge_type,
    image
  } = product;

  return (
    <div className="product-card card-saas group cursor-pointer" onClick={() => onActivate && onActivate(product.id)}>
      {/* Badge Status */}
      {badge_type && (
        <div className={`status-badge ${badge_type.toLowerCase().replace(' ', '-')}`}>
          {badge_type}
        </div>
      )}

      {/* Product Image/Visual Area */}
      <div className="card-visual relative overflow-hidden rounded-xl bg-black/40 mb-4 h-48 flex items-center justify-center">
         {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
         ) : (
            <h2 className="text-2xl font-black text-white/20 uppercase tracking-tighter text-center px-4">{name}</h2>
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{category}</span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-lg">
                🕒 {duration}
            </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">{name}</h3>
        
        <ul className="space-y-2 mb-6 flex-1">
          {features.slice(0, 3).map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-400">
               <span className="text-primary mt-0.5">✓</span> 
               <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white">{Number(price || 0).toLocaleString('vi-VN')}đ</span>
            {original_price && (
              <span className="text-xs text-slate-500 line-through">{Number(original_price).toLocaleString('vi-VN')}đ</span>
            )}
          </div>

          <button 
            className="btn-premium !py-2 !px-4 !text-xs"
            onClick={(e) => { e.stopPropagation(); onActivate(product.id); }}
          >
            Mua ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

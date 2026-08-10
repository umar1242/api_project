import React from 'react';
import { useShop, useGamificationStats } from '../hooks/useGamification';
import { Loader } from '@shared-ui/core';
import { ShoppingCart, Coins, AlertCircle, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CoinShopPageProps {
  courseId: string | null | undefined;
  userId?: string;
}

export const CoinShopPage: React.FC<CoinShopPageProps> = ({ courseId, userId }) => {
  const { items, isLoading, error, purchase } = useShop(courseId, userId);
  const { stats, refresh } = useGamificationStats(courseId, userId);
  const navigate = useNavigate();

  if (!courseId) {
    return (
      <div className="empty-state">
        <ShoppingCart size={48} className="empty-state__icon" />
        <h2 className="empty-state__title">No Course Found</h2>
        <p className="empty-state__desc">Enroll in a course to access the shop.</p>
        <button className="btn btn--primary" onClick={() => navigate('/progress')}>Go Back</button>
      </div>
    );
  }

  if (isLoading) return <Loader message="Loading shop items..." />;

  if (error) {
    return (
      <div className="error-state">
        <AlertCircle size={40} className="error-state__icon" />
        <p className="error-state__message">{error}</p>
        <button className="btn btn--primary" onClick={() => navigate('/progress')}>Go Back</button>
      </div>
    );
  }

  const handlePurchase = async (itemId: string) => {
    try {
      const res = await purchase(itemId);
      if (res.success) {
        alert('Purchase successful!');
        refresh(); // update coins
      } else {
        alert(res.message || 'Purchase failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error purchasing item');
    }
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h1 className="page-header__title">Coin Shop</h1>
          <ShoppingBag size={24} className="page-header__icon" />
        </div>
        <div className="gamification-badge coins-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold' }}>
          <Coins size={20} color="#f59e0b" />
          <span>{stats?.coins ?? 0}</span>
        </div>
      </div>

      <div className="shop-items" style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__desc">No items available in the shop right now.</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="card shop-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  <Coins size={16} />
                  <span>{item.price}</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>{item.description}</p>
              <button 
                className="btn btn--primary" 
                style={{ marginTop: '0.5rem' }}
                onClick={() => handlePurchase(item.id)}
                disabled={!item.isActive || (stats?.coins ?? 0) < item.price}
              >
                {(!item.isActive) ? 'Unavailable' : (stats?.coins ?? 0) < item.price ? 'Not enough coins' : 'Purchase'}
              </button>
            </div>
          ))
        )}
      </div>
      
      <button 
        className="btn btn--secondary" 
        style={{ marginTop: '1.5rem', width: '100%' }}
        onClick={() => navigate('/progress')}
      >
        Back to Progress
      </button>
    </div>
  );
};

import React from 'react';
import { useShop, useGamificationStats } from '../hooks/useGamification';
import { Loader } from '@shared-ui/core';
import { ShoppingCart, Coins, AlertCircle, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;

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
      <div className="page">
        <div className="empty-state card">
          <ShoppingCart size={48} className="empty-state__icon" />
          <h2 className="empty-state__title">No Course Found</h2>
          <p className="empty-state__desc">Enroll in a course to access the shop.</p>
          <button className="btn btn--primary mt-3" onClick={() => navigate('/progress')}>Go Back</button>
        </div>
      </div>
    );
  }

  if (isLoading) return <Loader message="Loading shop items..." />;

  if (error) {
    return (
      <div className="page">
        <div className="error-state card">
          <AlertCircle size={40} className="error-state__icon" />
          <p className="error-state__message">{error}</p>
          <button className="btn btn--primary mt-3" onClick={() => navigate('/progress')}>Go Back</button>
        </div>
      </div>
    );
  }

  const handlePurchase = async (itemId: string) => {
    WebApp.HapticFeedback?.impactOccurred('medium');
    try {
      const res = await purchase(itemId);
      if (res.success) {
        WebApp.HapticFeedback?.notificationOccurred('success');
        WebApp.showAlert('Purchase successful!');
        refresh(); // update coins
      } else {
        WebApp.HapticFeedback?.notificationOccurred('error');
        WebApp.showAlert(res.message || 'Purchase failed');
      }
    } catch (err: any) {
      WebApp.HapticFeedback?.notificationOccurred('error');
      WebApp.showAlert(err.message || 'Error purchasing item');
    }
  };

  return (
    <div className="page pb-24">
      <div className="page-header mb-3">
        <div className="flex items-center gap-2">
          <h1 className="page-header__title gradient-text">Coin Shop</h1>
          <ShoppingBag size={24} className="page-header__icon" />
        </div>
        <div className="gamification-badge">
          <Coins size={20} color="#f59e0b" />
          <span>{stats?.coins ?? 0}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {items.length === 0 ? (
          <div className="empty-state card">
            <p className="empty-state__desc">No items available in the shop right now.</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <div className="flex items-center gap-1 font-bold text-yellow-500">
                  <Coins size={16} />
                  <span>{item.price}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">{item.description}</p>
              <button 
                className="btn btn--primary btn--full" 
                onClick={() => handlePurchase(item.id)}
                disabled={!item.isActive || (stats?.coins ?? 0) < item.price}
              >
                {(!item.isActive) ? 'Unavailable' : (stats?.coins ?? 0) < item.price ? 'Not enough coins' : 'Purchase Item'}
              </button>
            </div>
          ))
        )}
      </div>
      
      <button 
        className="btn btn--secondary btn--full mt-4" 
        onClick={() => navigate('/progress')}
      >
        Back to Progress
      </button>
    </div>
  );
};

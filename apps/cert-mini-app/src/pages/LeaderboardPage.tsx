import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Star } from 'lucide-react';
import { apiClient } from '../api/client';
import { Loader } from '../components/Loader';

export const LeaderboardPage: React.FC = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await apiClient.get('/users/leaderboard');
        setLeaders(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return <div className="app-shell"><Loader message="Loading leaderboard..." /></div>;

  return (
    <div className="page pb-24">
      <div className="page-header mb-6">
        <h1 className="page-header__title gradient-text">Top Students</h1>
        <Trophy className="page-header__icon text-yellow-500" />
      </div>

      <div className="glass-form p-4 rounded-xl mb-6 flex flex-col items-center justify-center text-center">
        <Star size={32} className="text-yellow-400 mb-2" />
        <h2 className="font-bold text-lg">Keep Solving!</h2>
        <p className="text-sm text-gray-500">Earn XP by completing tests and homeworks to climb the ranks.</p>
      </div>

      <div className="flex flex-col gap-3">
        {leaders.map((student, index) => {
          let rankColor = "text-gray-400";
          let bgGlow = "";
          if (index === 0) {
            rankColor = "text-yellow-500";
            bgGlow = "shadow-[0_0_15px_rgba(234,179,8,0.2)] border-yellow-200/50";
          } else if (index === 1) {
            rankColor = "text-gray-400";
            bgGlow = "border-gray-200";
          } else if (index === 2) {
            rankColor = "text-amber-600";
            bgGlow = "border-amber-200/30";
          }

          return (
            <div key={student.id} className={`card glass-form flex items-center justify-between p-4 ${bgGlow}`}>
              <div className="flex items-center gap-4">
                <div className={`font-bold text-xl w-6 text-center ${rankColor}`}>
                  {index < 3 ? <Medal size={24} className="mx-auto" /> : `#${index + 1}`}
                </div>
                <div>
                  <div className="font-bold text-gray-800">{student.fullName}</div>
                  <div className="text-xs text-gray-500">Student</div>
                </div>
              </div>
              <div className="flex items-center gap-1 font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
                {student.xp} XP
              </div>
            </div>
          );
        })}

        {leaders.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No students on the leaderboard yet. Be the first!
          </div>
        )}
      </div>
    </div>
  );
};

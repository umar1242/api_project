import { useContext, useEffect, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { getMaterialsByGroup } from '../api';
import { Material } from '../types';
import { Search, Book, FileText, Download } from 'lucide-react';

export default function MaterialDashboard() {
  const { enrollments } = useContext(AppContext);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // For simplicity, just pick the first active enrollment's group
  const activeGroup = enrollments[0]?.groupId;

  useEffect(() => {
    if (!activeGroup) {
      setLoading(false);
      return;
    }
    async function loadMaterials() {
      try {
        const data = await getMaterialsByGroup(activeGroup);
        setMaterials(data);
      } catch (err) {
        console.error('Error fetching materials', err);
      } finally {
        setLoading(false);
      }
    }
    loadMaterials();
  }, [activeGroup]);

  const filteredMaterials = useMemo(() => {
    if (!searchQuery) return materials;
    return materials.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (m.content && m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [materials, searchQuery]);

  const groupedMaterials = useMemo(() => {
    const map = new Map<string, Material[]>();
    filteredMaterials.forEach(m => {
      const key = m.lessonId ?? 'General';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(m);
    });
    return Array.from(map.entries());
  }, [filteredMaterials]);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader-spinner" />
        <p>Loading materials...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Course Materials</h1>
        <p>Access your study resources here.</p>
      </header>

      <div className="search-bar">
        <Search className="search-icon" size={20} />
        <input 
          type="text" 
          placeholder="Search materials..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="materials-list">
        {groupedMaterials.length === 0 ? (
          <div className="empty-state">
            <Book size={48} className="empty-state__icon" />
            <h3 className="empty-state__title">No materials found</h3>
            <p className="empty-state__message">We couldn't find any materials matching your search.</p>
          </div>
        ) : (
          groupedMaterials.map(([lesson, items]) => (
            <div key={lesson} className="material-group">
              <h2 className="material-group__title">
                {lesson === 'General' ? 'General Resources' : `Lesson: ${lesson}`}
              </h2>
              <div className="material-grid">
                {items.map(item => (
                  <div key={item.id} className="material-card">
                    <div className="material-card__header">
                      <FileText className="material-card__icon" size={24} />
                      <h3 className="material-card__title">{item.title}</h3>
                    </div>
                    {item.content && (
                      <p className="material-card__content">{item.content}</p>
                    )}
                    <div className="material-card__footer">
                      <span className="material-card__date">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      {item.fileUrl && (
                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="material-card__download">
                          <Download size={16} /> Download
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

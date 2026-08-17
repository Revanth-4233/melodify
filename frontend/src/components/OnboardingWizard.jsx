import React, { useState } from 'react';
import { ArrowLeft, Search, Check } from 'lucide-react';

const LANGUAGES = [
  { id: 'Hindi', label: 'Hindi', color: '#E91E63', image: 'https://i.scdn.co/image/ab6761610000e5ebcb6926f44f620555ba444fca' },
  { id: 'International', label: 'International', color: '#FF9800', image: 'https://i.scdn.co/image/ab6761610000e5eb8ae7f2aaa9817a704a87ea36' },
  { id: 'Punjabi', label: 'Punjabi', color: '#9C27B0', image: 'https://i.scdn.co/image/ab6761610000e5ebc40600e0235660000851df9d' },
  { id: 'Tamil', label: 'Tamil', color: '#FFEB3B', image: 'https://i.scdn.co/image/ab6761610000e5eb7a41498305c0cc8e415fb895' },
  { id: 'Telugu', label: 'Telugu', color: '#4CAF50', image: 'https://i.scdn.co/image/ab6761610000e5ebe89f2d93eec6fbd67245c6ee' },
  { id: 'Malayalam', label: 'Malayalam', color: '#80CBC4', image: 'https://i.scdn.co/image/ab6761610000e5eb9d0af11b91950d99dc07fb51' },
  { id: 'Marathi', label: 'Marathi', color: '#FFB74D', image: 'https://i.scdn.co/image/ab6761610000e5eb38ee7002dc8517da7e31b315' },
  { id: 'Gujarati', label: 'Gujarati', color: '#F48FB1', image: 'https://i.scdn.co/image/ab6761610000e5eb3d1bdad081c7f7bc86e3f43b' },
  { id: 'Bengali', label: 'Bengali', color: '#64B5F6', image: 'https://i.scdn.co/image/ab6761610000e5eba7a98db253457a44f4e242a4' },
  { id: 'Kannada', label: 'Kannada', color: '#E53935', image: 'https://i.scdn.co/image/ab6761610000e5ebe6aee5582f7c00e163da13f8' }
];

const ARTISTS_BY_LANGUAGE = {
  'Telugu': [
    { name: 'Anirudh Ravichander' },
    { name: 'A.R. Rahman' },
    { name: 'Devi Sri Prasad' },
    { name: 'Thaman S' },
    { name: 'Mickey J. Meyer' },
    { name: 'Harris Jayaraj' },
    { name: 'S. P. Balasubrahmanyam' },
    { name: 'Mani Sharma' },
    { name: 'Yuvan Shankar Raja' }
  ],
  'Hindi': [
    { name: 'Arijit Singh' },
    { name: 'Pritam' }
  ]
};

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(0); // 0: DOB, 1: Name, 2: Language, 3: Artist
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    preferredLanguages: [],
    preferredArtists: []
  });
  
  const [artistSearch, setArtistSearch] = useState('');
  const [activeArtistFilter, setActiveArtistFilter] = useState('For You');

  const toggleSelection = (field, item) => {
    setFormData(prev => {
      const list = prev[field];
      if (list.includes(item)) {
        return { ...prev, [field]: list.filter(i => i !== item) };
      }
      return { ...prev, [field]: [...list, item] };
    });
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const getAvailableArtists = () => {
    let artistsMap = new Map();
    // Use fallback to Telugu if no language chosen or array is empty
    const langs = formData.preferredLanguages.length > 0 ? formData.preferredLanguages : ['Telugu'];
    langs.forEach(lang => {
      if (ARTISTS_BY_LANGUAGE[lang]) {
        ARTISTS_BY_LANGUAGE[lang].forEach(a => {
          if (!artistsMap.has(a.name)) artistsMap.set(a.name, a);
        });
      }
    });
    // Add fallback artists if still empty
    if (artistsMap.size === 0) {
      ARTISTS_BY_LANGUAGE['Telugu'].forEach(a => artistsMap.set(a.name, a));
    }
    
    let arr = Array.from(artistsMap.values());
    if (artistSearch) {
      arr = arr.filter(a => a.name.toLowerCase().includes(artistSearch.toLowerCase()));
    }
    return arr;
  };

  const handleSubmit = async () => {
    if (formData.preferredArtists.length < 3) return;
    setLoading(true);
    await onComplete({
      ...formData,
      // Default to "User" if they skipped name step somehow
      fullName: formData.fullName || 'User',
      dateOfBirth: formData.dateOfBirth || '2000-01-01'
    });
    setLoading(false);
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-full-screen">
        <div className="onboarding-top-bar">
          {step > 0 && (
            <button className="onboarding-back-btn" onClick={prevStep}>
              <ArrowLeft size={24} />
            </button>
          )}
        </div>

        {/* STEP 0: Date of Birth */}
        {step === 0 && (
          <div className="onboarding-content">
            <h1 className="spotify-heading-huge">What's your date of birth?</h1>
            <div className="date-picker-mock">
              <input 
                type="date" 
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                className="date-input-styled"
              />
            </div>
            <div className="bottom-action">
              <button 
                className="btn-spotify-rounded" 
                disabled={!formData.dateOfBirth}
                onClick={nextStep}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Name */}
        {step === 1 && (
          <div className="onboarding-content">
            <h1 className="spotify-heading-huge">What's your name?</h1>
            <p className="subtitle-gray">This appears on your profile.</p>
            <input 
              type="text" 
              className="spotify-line-input"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
            <div className="bottom-action">
              <button 
                className="btn-spotify-rounded" 
                disabled={!formData.fullName}
                onClick={nextStep}
              >
                Create account
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Languages */}
        {step === 2 && (
          <div className="onboarding-content step-languages">
            <h1 className="spotify-heading-huge">What music do you like?</h1>
            <div className="language-grid">
              {LANGUAGES.map(lang => (
                <div 
                  key={lang.id}
                  className="language-card"
                  style={{ backgroundColor: lang.color }}
                  onClick={() => toggleSelection('preferredLanguages', lang.id)}
                >
                  <span className="lang-name">{lang.label}</span>
                  {formData.preferredLanguages.includes(lang.id) && (
                    <div className="lang-check"><Check size={14} color="#000" strokeWidth={3} /></div>
                  )}
                </div>
              ))}
            </div>
            <div className="bottom-action">
              <button 
                className="btn-spotify-rounded" 
                onClick={nextStep}
                disabled={formData.preferredLanguages.length === 0}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Artists */}
        {step === 3 && (
          <div className="onboarding-content step-artists">
            <h1 className="spotify-heading-huge">Choose 3 or more artists you like.</h1>
            
            <div className="artist-search-bar">
              <Search size={20} color="#b3b3b3" />
              <input 
                type="text" 
                placeholder="Search" 
                value={artistSearch}
                onChange={(e) => setArtistSearch(e.target.value)}
              />
            </div>

            <div className="artist-filter-pills">
              {['For You', ...formData.preferredLanguages].map(pill => (
                <button 
                  key={pill} 
                  className={`artist-pill ${activeArtistFilter === pill ? 'active' : ''}`}
                  onClick={() => setActiveArtistFilter(pill)}
                >
                  {pill}
                </button>
              ))}
            </div>

            <div className="artist-circle-grid">
              {getAvailableArtists().map(artist => {
                const isSelected = formData.preferredArtists.includes(artist.name);
                return (
                  <div 
                    key={artist.name}
                    className="artist-circle-card"
                    onClick={() => toggleSelection('preferredArtists', artist.name)}
                  >
                    <div className="artist-circle-img-wrapper">
                      <img src={artist.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=random&size=200&bold=true&color=fff`} alt={artist.name} className={isSelected ? 'selected' : ''} />
                      {isSelected && (
                        <div className="artist-circle-check">
                          <Check size={16} color="#000" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="artist-circle-name">{artist.name}</span>
                  </div>
                );
              })}
            </div>

            {formData.preferredArtists.length >= 3 && (
              <div className="bottom-action fixed-bottom">
                <button 
                  className="btn-spotify-rounded" 
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Done'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

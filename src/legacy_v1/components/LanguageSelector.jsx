import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, Space } from 'antd';
import { GlobalOutlined, DownOutlined } from '@ant-design/icons';

const languages = [
  {
    key: 'kaa-latn',
    label: 'Qaraqalpaq (Lotin)',
    flag: '🇺🇿'
  },
  {
    key: 'kaa-cyrl',
    label: 'Қарақалпақ (Кирил)',
    flag: '🇺🇿'
  },
  {
    key: 'uz-latn',
    label: 'O\'zbek (Lotin)',
    flag: '🇺🇿'
  },
  {
    key: 'uz-cyrl',
    label: 'Ўзбек (Кирил)',
    flag: '🇺🇿'
  },
  {
    key: 'ru',
    label: 'Русский',
    flag: '🇷🇺'
  },
  {
    key: 'en',
    label: 'English',
    flag: '🇬🇧'
  }
];

export default function LanguageSelector({ mode = 'default' }) {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(
    languages.find(l => l.key === i18n.language) || languages[2]
  );

  const handleLanguageChange = ({ key }) => {
    const lang = languages.find(l => l.key === key);
    if (lang) {
      i18n.changeLanguage(key);
      setCurrentLang(lang);
      localStorage.setItem('language', key);
    }
  };

  const items = languages.map(lang => ({
    key: lang.key,
    label: (
      <div className="flex items-center space-x-2 px-2 py-1">
        <span className="text-xl">{lang.flag}</span>
        <span>{lang.label}</span>
      </div>
    )
  }));

  // Compact mode for login/register pages
  if (mode === 'compact') {
    return (
      <div className="inline-flex items-center space-x-2 bg-white/50 px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm cursor-pointer hover:bg-white/70 transition-colors">
        <Dropdown
          menu={{
            items,
            onClick: handleLanguageChange
          }}
          trigger={['click']}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">{currentLang.flag}</span>
            <span className="text-xs font-bold text-gray-600 uppercase">
              {currentLang.label}
            </span>
            <DownOutlined className="text-gray-400 text-xs" />
          </div>
        </Dropdown>
      </div>
    );
  }

  // Default mode for settings and other pages
  return (
    <Dropdown
      menu={{
        items,
        onClick: handleLanguageChange
      }}
      trigger={['click']}
      placement="bottomRight"
    >
      <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200">
        <GlobalOutlined className="text-lg text-blue-600" />
        <Space>
          <span className="text-lg">{currentLang.flag}</span>
          <span className="font-medium">{currentLang.label}</span>
          <DownOutlined className="text-xs text-gray-400" />
        </Space>
      </div>
    </Dropdown>
  );
}

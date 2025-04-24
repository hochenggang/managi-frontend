import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import zh from './locales/zh.json';

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'zh', // 默认语言
  fallbackLocale: 'en', // 回退语言
  messages: {
    zh,
    en,
  }
});

export default i18n;
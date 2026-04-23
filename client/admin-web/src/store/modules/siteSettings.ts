import { defineStore } from 'pinia';
import { ref } from 'vue';
import { systemApi } from '@/api/system';
import type { SiteSettings } from '@/api/system';

const defaultSiteSettings: SiteSettings = {
  siteName: '',
  siteDescription: '',
  logo: '',
  favicon: '',
};

export const useSiteSettingsStore = defineStore('siteSettings', () => {
  const site = ref<SiteSettings>({ ...defaultSiteSettings });
  const loaded = ref(false);

  async function loadSettings() {
    if (loaded.value) return;
    try {
      const res = await systemApi.getSettings();
      site.value = { ...res.data.data.site };
      loaded.value = true;
    } catch {
      loaded.value = true;
    }
  }

  function updateSite(newSite: Partial<SiteSettings>) {
    site.value = { ...site.value, ...newSite };
  }

  return {
    site,
    loaded,
    loadSettings,
    updateSite,
  };
});

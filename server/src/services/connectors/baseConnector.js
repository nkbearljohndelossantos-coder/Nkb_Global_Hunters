export class BaseConnector {
  constructor(name, code, requiresAuth = false) {
    this.name = name;
    this.code = code;
    this.requiresAuth = requiresAuth;
    this.rateLimitPerMinute = 30;
    this.lastRequestTimestamp = 0;
  }

  async checkRateLimit() {
    const now = Date.now();
    const minIntervalMs = 60000 / this.rateLimitPerMinute;
    const elapsed = now - this.lastRequestTimestamp;
    if (elapsed < minIntervalMs) {
      await new Promise(resolve => setTimeout(resolve, minIntervalMs - elapsed));
    }
    this.lastRequestTimestamp = Date.now();
  }

  async search(params) {
    throw new Error('search() method must be implemented by subclass');
  }

  formatResult(item) {
    return {
      legalName: item.legalName,
      tradingName: item.tradingName || item.legalName,
      officialWebsite: item.officialWebsite || null,
      domain: item.domain || null,
      primaryCountry: item.primaryCountry || 'Unknown',
      primaryCity: item.primaryCity || null,
      primaryIndustry: item.primaryIndustry || 'Cosmetics',
      businessType: item.businessType || 'Brand Owner',
      businessDescription: item.businessDescription || '',
      productsSummary: item.productsSummary || '',
      nkbServiceFit: item.nkbServiceFit || 'Cosmetics OEM/ODM',
      sourceAttribution: item.sourceAttribution || `Retrieved via ${this.name}`,
      confidenceLevel: item.confidenceLevel || 'medium',
      rawSourceUrl: item.rawSourceUrl || null,
      whatsappNumber: item.whatsappNumber || null,
      whatsappUrl: item.whatsappUrl || null,
      instagramUrl: item.instagramUrl || null,
      facebookUrl: item.facebookUrl || null,
      linkedinUrl: item.linkedinUrl || null,
      tiktokUrl: item.tiktokUrl || null,
      youtubeUrl: item.youtubeUrl || null
    };
  }
}

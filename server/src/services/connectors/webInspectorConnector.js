import { BaseConnector } from './baseConnector.js';

export class WebInspectorConnector extends BaseConnector {
  constructor() {
    super('Public Website & Metadata Inspector', 'web_inspector', false);
    this.rateLimitPerMinute = 30;
  }

  async inspectDomain(urlOrDomain) {
    await this.checkRateLimit();

    let targetUrl = urlOrDomain.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NKBGlobalHunter/1.0',
          'Accept': 'text/html,application/xhtml+xml'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        return {
          isLive: false,
          statusCode: response.status,
          error: `HTTP ${response.status}`
        };
      }

      const html = await response.text();

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';

      // Extract meta description
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
      const description = descMatch ? descMatch[1].trim() : '';

      // Extract OpenGraph tags
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
      const ogSiteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);

      // Detect potential public contact channels or page links
      const hasContactLink = /href=["'][^"']*(contact|contact-us|inquiry|touch)[^"']*["']/i.test(html);
      const hasAboutLink = /href=["'][^"']*(about|about-us|company|story)[^"']*["']/i.test(html);
      const hasOemMention = /(oem|odm|private label|contract manufacturing|distributor|wholesale)/i.test(html);

      // Extract any publicly listed contact emails in mailto: links (strictly publicly displayed)
      const mailtoMatches = [...html.matchAll(/href=["']mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']/gi)];
      const publicEmails = [...new Set(mailtoMatches.map(m => m[1]))];

      // Extract WhatsApp Channels
      let whatsappUrl = null;
      let whatsappNumber = null;

      const waMatch = html.match(/href=["'](https?:\/\/(?:api\.)?whatsapp\.com\/send\?[^"']*|https?:\/\/wa\.me\/[0-9+]+[^"']*|whatsapp:\/\/[^"']*)["']/i);
      if (waMatch) {
        whatsappUrl = waMatch[1].replace(/&amp;/g, '&');
        const phoneParam = whatsappUrl.match(/(?:phone=|wa\.me\/|\/send\?phone=)([0-9+]+)/i);
        if (phoneParam) {
          whatsappNumber = phoneParam[1].replace(/^\+/, '');
          whatsappUrl = `https://wa.me/${whatsappNumber}`;
        }
      }

      if (!whatsappUrl) {
        const waTextMatch = html.match(/(?:whatsapp|wa|whatsapp business)[:\s]+([+]?[0-9\s-]{10,18})/i);
        if (waTextMatch) {
          const rawNum = waTextMatch[1].replace(/[^0-9]/g, '');
          if (rawNum.length >= 10 && rawNum.length <= 15) {
            whatsappNumber = rawNum;
            whatsappUrl = `https://wa.me/${rawNum}`;
          }
        }
      }

      // Extract Instagram
      const igMatch = html.match(/href=["'](https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9._-]+))\/?["']/i);
      let instagramUrl = null;
      if (igMatch && !['p', 'stories', 'explore', 'reels', 'tv'].includes(igMatch[2].toLowerCase())) {
        instagramUrl = `https://www.instagram.com/${igMatch[2]}`;
      }

      // Extract Facebook
      const fbMatch = html.match(/href=["'](https?:\/\/(?:www\.)?(?:facebook\.com|fb\.com)\/([a-zA-Z0-9._-]+))\/?["']/i);
      let facebookUrl = null;
      if (fbMatch && !['sharer', 'share', 'tr', 'plugins', 'dialog'].includes(fbMatch[2].toLowerCase())) {
        facebookUrl = `https://www.facebook.com/${fbMatch[2]}`;
      }

      // Extract LinkedIn
      const liMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9._-]+))\/?["']/i);
      let linkedinUrl = liMatch ? liMatch[1] : null;

      // Extract TikTok
      const ttMatch = html.match(/href=["'](https?:\/\/(?:www\.)?tiktok\.com\/(@[a-zA-Z0-9._-]+))\/?["']/i);
      let tiktokUrl = ttMatch ? ttMatch[1] : null;

      // Extract YouTube
      const ytMatch = html.match(/href=["'](https?:\/\/(?:www\.)?youtube\.com\/(?:@[a-zA-Z0-9._-]+|channel\/[a-zA-Z0-9_-]+|c\/[a-zA-Z0-9._-]+))\/?["']/i);
      let youtubeUrl = ytMatch ? ytMatch[1] : null;

      // Extract Telephone
      const telMatch = html.match(/href=["']tel:([^"']+)["']/i);
      const phoneNumber = telMatch ? telMatch[1].trim() : null;

      return {
        isLive: true,
        finalUrl: response.url,
        title: title || (ogTitleMatch ? ogTitleMatch[1] : ''),
        brandName: (ogSiteMatch ? ogSiteMatch[1] : '') || title.split(/[-|–]/)[0]?.trim() || '',
        description: description,
        hasContactPage: hasContactLink,
        hasAboutPage: hasAboutLink,
        mentionsOemOrWholesale: hasOemMention,
        publicEmails: publicEmails,
        whatsappNumber: whatsappNumber,
        whatsappUrl: whatsappUrl,
        instagramUrl: instagramUrl,
        facebookUrl: facebookUrl,
        linkedinUrl: linkedinUrl,
        tiktokUrl: tiktokUrl,
        youtubeUrl: youtubeUrl,
        phoneNumber: phoneNumber,
        inspectionTimestamp: new Date().toISOString()
      };
    } catch (err) {
      return {
        isLive: false,
        error: err.message,
        inspectionTimestamp: new Date().toISOString()
      };
    }
  }
}

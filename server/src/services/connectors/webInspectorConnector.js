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
